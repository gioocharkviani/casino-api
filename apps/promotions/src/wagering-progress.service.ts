import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import {
  UserPromotionEntity,
  UserPromotionStatus,
  PromotionAuditAction,
  PromotionAuditEntity,
} from 'libs/database/entities/promotions.entity';
import { BetSettledEventDto } from 'libs/common/dto/promotion.dto';

@Injectable()
export class WageringProgressService {
  private readonly logger = new Logger(WageringProgressService.name);

  constructor(
    @InjectRepository(UserPromotionEntity)
    private readonly userPromoRepo: Repository<UserPromotionEntity>,
    @InjectRepository(PromotionAuditEntity)
    private readonly auditRepo: Repository<PromotionAuditEntity>,
    @Inject('WALLET_MS_SERVICE')
    private readonly walletClient: ClientProxy,
  ) {}

  async applyBet(evt: BetSettledEventDto) {
    const active = await this.userPromoRepo.find({
      where: { userId: evt.userId, status: UserPromotionStatus.ACTIVE },
      relations: { promotion: true },
    });

    for (const up of active) {
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
        await this.complete(up);
      } else {
        await this.userPromoRepo.save(up);
      }
    }
  }

  // expire bonuses past their deadline (called by cron)
  async expireStale() {
    const now = new Date();
    const stale = await this.userPromoRepo
      .createQueryBuilder('up')
      .where('up.status = :status', { status: UserPromotionStatus.ACTIVE })
      .andWhere('up.expiresAt < :now', { now })
      .getMany();

    for (const up of stale) {
      up.status = UserPromotionStatus.EXPIRED;
      up.bonusBalance = 0;
      await this.userPromoRepo.save(up);

      await this.writeAudit(PromotionAuditAction.EXPIRED, {
        promotionId: up.promotionId,
        userId: up.userId,
        performedBy: 'system:cron',
      });

      this.logger.log(`Expired bonus ${up.id} for user ${up.userId}`);
    }

    return stale.length;
  }

  private async complete(up: UserPromotionEntity) {
    const remaining = Number(up.bonusBalance);
    const cap = up.promotion.maxWithdrawal
      ? Number(up.promotion.maxWithdrawal)
      : remaining;
    const payout = Math.min(remaining, cap);

    if (payout > 0) {
      const txId = `promo-complete-${up.id}`;
      try {
        await lastValueFrom(
          this.walletClient
            .send('WALLET_CREDIT', {
              playerId: up.userId,
              amount: payout,
              transactionId: txId,
              reason: `Bonus ${up.promotion.name} wagering completed`,
              gameId: 'bonus-system',
              roundId: txId,
              currency: 'USD',
              relatedExternalDebitTransactionId: txId,
            })
            .pipe(timeout(5000)),
        );
      } catch (err: any) {
        this.logger.error(`wallet credit on completion failed: ${err.message}`);
      }
    }

    up.bonusBalance = 0;
    up.status = UserPromotionStatus.COMPLETED;
    await this.userPromoRepo.save(up);

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
