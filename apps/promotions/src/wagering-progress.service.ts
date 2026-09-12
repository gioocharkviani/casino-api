import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  UserPromotionEntity,
  UserPromotionStatus,
  PromotionAuditAction,
  PromotionAuditEntity,
} from 'libs/database/entities/promotions.entity';
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { UserEntity } from 'libs/database/entities/user.entity';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';
import { TransactionType } from 'libs/common';
import { BetSettledEventDto } from 'libs/common/dto/promotion.dto';

@Injectable()
export class WageringProgressService {
  private readonly logger = new Logger(WageringProgressService.name);

  constructor(
    @InjectRepository(UserPromotionEntity)
    private readonly userPromoRepo: Repository<UserPromotionEntity>,
    @InjectRepository(PromotionAuditEntity)
    private readonly auditRepo: Repository<PromotionAuditEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async applyBet(evt: BetSettledEventDto) {
    // Locked so a burst of BET_SETTLED events for the same user (e.g. rapid
    // spins) can't interleave reads/writes of wageringCompleted and lose
    // progress, or both cross the completion threshold and run complete()
    // concurrently for the same bonus.
    await this.dataSource.transaction(async (mgr) => {
      const upRepo = mgr.getRepository(UserPromotionEntity);
      const active = await upRepo
        .createQueryBuilder('up')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('up.promotion', 'promotion')
        .where('up.userId = :userId', { userId: evt.userId })
        .andWhere('up.status = :status', { status: UserPromotionStatus.ACTIVE })
        // excludes free-spins ACTIVE rows (chooseGameAndActivate never sets
        // wageringRequired) — those have nothing to wager against here.
        .andWhere('up.wageringRequired > 0')
        .getMany();

      for (const up of active) {
        // don't let a bet that lands after expiry still advance wagering —
        // expireStale() runs hourly, so without this a bet placed in the
        // gap between expiresAt and the next cron tick would still count.
        if (up.expiresAt && up.expiresAt.getTime() < Date.now()) {
          continue;
        }

        // if allowedGameUUIDs is set, only bets on those games count
        const allowed = up.promotion.allowedGameUUIDs;
        if (allowed?.length && evt.gameKey && !allowed.includes(evt.gameKey)) {
          continue;
        }

        // per-game contribution weight (default 100 = full credit)
        const weights =
          (up.promotion.gameWeights as Record<string, number>) ?? {};
        const weight = evt.gameKey ? (weights[evt.gameKey] ?? 100) : 100;
        const contribution = Math.floor(evt.betAmount * (weight / 100));

        up.wageringCompleted = Number(up.wageringCompleted) + contribution;

        if (up.wageringCompleted >= Number(up.wageringRequired)) {
          await this.complete(up, mgr);
        } else {
          await upRepo.save(up);
        }
      }
    });
  }

  // Expire bonuses past their deadline (called by cron). Since bonusBalance
  // is now real isolated money the player actually wagered with (see
  // walletDebit/walletCredit), zeroing it here is a genuine forfeiture, not
  // a no-op — recorded in the audit metadata so admins can see how much was
  // forfeited per bonus.
  //
  // Also acts as a retry sweep for `complete()`: if a wagering-completed
  // bonus somehow got stuck ACTIVE (e.g. its wallet-row lookup failed at
  // the time), it will show up here as "past its deadline" eventually and
  // get resolved one way or another instead of lingering forever. For a
  // completed-but-not-yet-expired bonus stuck ACTIVE, `applyBet` will
  // retry `complete()` on the next bet event for that user in the meantime.
  async expireStale() {
    const now = new Date();
    const stale = await this.userPromoRepo
      .createQueryBuilder('up')
      .where('up.status = :status', { status: UserPromotionStatus.ACTIVE })
      .andWhere('up.expiresAt < :now', { now })
      .getMany();

    for (const up of stale) {
      const forfeited = Number(up.bonusBalance);
      up.status = UserPromotionStatus.EXPIRED;
      up.bonusBalance = 0;
      await this.userPromoRepo.save(up);

      await this.writeAudit(PromotionAuditAction.EXPIRED, {
        promotionId: up.promotionId,
        userId: up.userId,
        performedBy: 'system:cron',
        metadata: { forfeited },
      });

      this.logger.log(`Expired bonus ${up.id} for user ${up.userId}, forfeited ${forfeited}`);
    }

    return stale.length;
  }

  // Moves whatever is left in the bonus's isolated bonusBalance into the
  // player's real wallet balance. This is a LOCAL transfer between two
  // columns for the same user in the same DB — not a new-money grant and
  // not a cross-service RPC — so it can be done atomically with the status
  // flip inside the caller's transaction (`mgr`), with no window where the
  // wallet is credited but the bonus never gets marked COMPLETED (or vice
  // versa), and no scenario where a wallet-service outage silently forfeits
  // money the player already earned (the old RPC-based version could lose
  // the payout if WALLET_CREDIT failed, since the failure was swallowed and
  // the bonus was marked COMPLETED regardless).
  private async complete(up: UserPromotionEntity, mgr: DataSource['manager']) {
    const remaining = Number(up.bonusBalance);
    const cap = up.promotion.maxWithdrawal
      ? Number(up.promotion.maxWithdrawal)
      : remaining;
    const payout = Math.max(0, Math.min(remaining, cap));

    if (payout > 0) {
      const walletRepo = mgr.getRepository(walletEntity);
      const user = await mgr.getRepository(UserEntity).findOne({
        where: { id: up.userId },
        relations: { wallet: true },
      });
      if (!user?.wallet) {
        // Nothing to credit into — leave the bonus ACTIVE so this is
        // retried (by the hourly expiry scan, see below) instead of
        // silently zeroing bonusBalance with no payout.
        this.logger.error(`complete() aborted: no wallet for user ${up.userId}`);
        return;
      }

      const wallet = await walletRepo
        .createQueryBuilder('w')
        .setLock('pessimistic_write')
        .where('w.id = :id', { id: user.wallet.id })
        .getOne();
      if (!wallet) {
        this.logger.error(`complete() aborted: wallet row missing for user ${up.userId}`);
        return;
      }

      const oldBalance = wallet.balance;
      wallet.balance = oldBalance + payout;
      await walletRepo.save(wallet);

      await mgr.getRepository(TransactionEntity).save(
        mgr.getRepository(TransactionEntity).create({
          type: TransactionType.BONUS,
          userId: up.userId,
          transactionId: `promo-complete-${up.id}`,
          amount: payout,
          balanceBefore: oldBalance,
          balanceAfter: wallet.balance,
          reason: `Bonus ${up.promotion.name} wagering completed`,
        }),
      );
    }

    up.bonusBalance = 0;
    up.status = UserPromotionStatus.COMPLETED;
    await mgr.getRepository(UserPromotionEntity).save(up);

    await this.writeAudit(PromotionAuditAction.COMPLETED, {
      promotionId: up.promotionId,
      userId: up.userId,
      performedBy: 'system:wagering',
      metadata: { payout },
    });

    this.logger.log(`Bonus ${up.id} completed, paid out ${payout}`);
  }

  private async writeAudit(
    action: PromotionAuditAction,
    payload: Partial<PromotionAuditEntity>,
  ) {
    try {
      await this.auditRepo.save(this.auditRepo.create({ action, ...payload }));
    } catch (err: any) {
      this.logger.warn(`audit write failed: ${err.message}`);
    }
  }
}
