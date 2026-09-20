import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CreditRequestDto,
  DebitAndCreditDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { TransactionType } from 'libs/common';
import { UserEntity } from 'libs/database/entities/user.entity';
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { GameSession } from 'libs/database/entities/game.entity';
import {
  UserPromotionEntity,
  UserPromotionStatus,
} from 'libs/database/entities/promotions.entity';
import { DataSource, Repository } from 'typeorm';
import { transactionService } from './transactions/transaction.service';
import { WageringService } from 'libs/common/services/wagering.service';
import { lastValueFrom } from 'rxjs';

// Carries a business-error code/message out of a dataSource.transaction()
// callback without it being swallowed as a generic 500 by the outer catch.
class WalletOpError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class WalletService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    @Inject('USER_MS_SERVICE') private userClient: ClientProxy,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(walletEntity)
    private readonly walletRepository: Repository<walletEntity>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly transactionService: transactionService,
    private readonly configService: ConfigService,
    private readonly wageringService: WageringService,
  ) {}

  // Locks and returns the caller's oldest ACTIVE wagered bonus, if any.
  // Only one wagered bonus may be ACTIVE per user at a time (enforced in
  // PromotionsService.activate), so "oldest" is really "the one".
  //
  // `wageringRequired > 0` excludes ACTIVE rows created by free-spins
  // promos (PromotionsService.chooseGameAndActivate flips status to ACTIVE
  // but never sets bonusBalance/wageringRequired — those wins are meant to
  // land in the real wallet like any other spin, not get vacuumed into a
  // bonusBalance that was never actually funded).
  private async lockActiveBonus(mgr: DataSource['manager'], userId: string) {
    return mgr
      .getRepository(UserPromotionEntity)
      .createQueryBuilder('up')
      .setLock('pessimistic_write')
      .where('up.userId = :userId', { userId })
      .andWhere('up.status = :status', { status: UserPromotionStatus.ACTIVE })
      .andWhere('up.wageringRequired > 0')
      .orderBy('up.activatedAt', 'ASC')
      .getOne();
  }

  // Plain (unlocked) real+bonus balance read — for callbacks that only need
  // to report numbers, not mutate them.
  private async balanceBreakdown(userId: string): Promise<{ real: number; bonus: number; total: number }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { wallet: true },
    });
    const activeBonus = await this.dataSource.getRepository(UserPromotionEntity).findOne({
      where: { userId, status: UserPromotionStatus.ACTIVE },
      order: { activatedAt: 'ASC' },
    });
    const real = user?.wallet?.balance ?? 0;
    const bonus = activeBonus ? Number(activeBonus.bonusBalance) : 0;
    return { real, bonus, total: real + bonus };
  }

  // ── NUXGAME CALLBACKS (Nuxgame -> us) ──────────────
  // Real contract per apidoc.fungamess.games/nuxgame-aggregation/openapi/callback-api.
  // Balances here are decimals (major units) per NuxGame's spec — our
  // internal storage is minor units (cents), hence the /100 conversions.

  async nuxgamePlayerDetails(userId: string, token: string) {
    const session = await this.gameSessionRepository.findOne({
      where: { playerId: userId, token, isActive: true },
    });
    if (!session) {
      return { status: false, errors: { code: 417, error: 'Token not found' } };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { country: true, wallet: true },
    });
    if (!user) {
      return { status: false, errors: { code: 404, error: 'User not found' } };
    }

    const { real, bonus, total } = await this.balanceBreakdown(userId);

    return {
      status: true,
      userId: user.id,
      balance: total / 100,
      realBalance: real / 100,
      bonusBalance: bonus / 100,
      nickname: user.userName,
      currency: this.configService.get('DEFAULT_CURRENCY') || 'USD',
      language: user.country?.language || 'en',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async nuxgameSessionCheck(userId: string, token: string) {
    const session = await this.gameSessionRepository.findOne({
      where: { playerId: userId, token, isActive: true },
    });
    if (!session) {
      return { status: false, errors: { code: 410, error: 'Token expired' } };
    }
    return { status: true };
  }

  async nuxgameGetBalance(userId: string, token: string) {
    const session = await this.gameSessionRepository.findOne({
      where: { playerId: userId, token, isActive: true },
    });
    if (!session) {
      return { status: false, errors: { code: 417, error: 'Token not found' } };
    }

    const { real, bonus, total } = await this.balanceBreakdown(userId);
    return {
      status: true,
      balance: total / 100,
      realBalance: real / 100,
      bonusBalance: bonus / 100,
    };
  }

  async nuxgameMoveFunds(data: {
    token: string;
    userId: string;
    gameId: number | string;
    eventId: string;
    direction: 'debit' | 'credit';
    transactionId: string;
    eventType: string;
    amount: number | string;
  }) {
    const session = await this.gameSessionRepository.findOne({
      where: { playerId: data.userId, token: data.token, isActive: true },
    });
    if (!session) {
      return { status: false, errors: { code: 417, error: 'Token not found' } };
    }

    const amountMinor = Math.round(Number(data.amount) * 100);
    const currency = this.configService.get('DEFAULT_CURRENCY') || 'USD';

    if (data.direction === 'debit') {
      const res = await this.walletDebit({
        playerId: data.userId,
        gameId: String(data.gameId),
        currency,
        roundId: data.eventId,
        transactionId: data.transactionId,
        amount: amountMinor,
      } as DebitRequestDto);

      if (res.code !== 200) {
        return {
          status: false,
          errors: { code: res.code === 1503 ? 402 : 1000, error: res.message },
        };
      }
    } else {
      const res = await this.walletCredit({
        playerId: data.userId,
        gameId: String(data.gameId),
        currency,
        roundId: data.eventId,
        transactionId: data.transactionId,
        amount: amountMinor,
        relatedExternalDebitTransactionId: data.transactionId,
      } as CreditRequestDto);

      if (res.code !== 200) {
        return { status: false, errors: { code: 1000, error: res.message } };
      }
    }

    const { real, bonus, total } = await this.balanceBreakdown(data.userId);
    return {
      status: true,
      balance: total / 100,
      realBalance: real / 100,
      bonusBalance: bonus / 100,
    };
  }

  // WALLET AUTH
  async walletAuth(data: WalletAuthDto) {
    const tokenValidationReq = await lastValueFrom(
      this.client.send('VALIDATE_GAME_SESSION', data.token),
    );

    if (!tokenValidationReq.valid) {
      return { code: 1403, message: 'Unauthorized wallet', data: null };
    }

    const userData = await this.userRepository.findOne({
      where: { id: tokenValidationReq.data.playerId },
      relations: { country: true, wallet: true },
      select: { country: true, wallet: true },
    });

    return {
      code: 200,
      data: {
        playerId: userData?.id,
        currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
        language: userData?.country.language || 'en',
        nickname: userData?.userName,
        balance: userData?.wallet?.balance,
        license: userData?.country.license || null,
        countryCode: userData?.country.countryCode,
        sessionState: {},
        brand: this.configService.get('WEBSITE_BRAND'),
        additionalData: {},
      },
      message: 'Success',
    };
  }

  // WALLET BALANCE
  async getWalletBallance(data: WalletBallanceDto) {
    const user = await this.userRepository.findOne({
      where: { id: data.playerId },
      relations: { wallet: true },
    });

    if (!user) {
      return { code: 1501, data: {}, message: 'User Not Found' };
    }

    return {
      code: 200,
      data: { balance: user.wallet?.balance || 0, sessionState: null },
      message: 'Success',
    };
  }

  // WALLET DEBIT
  async walletDebit(data: DebitRequestDto) {
    console.log('debit data', data);
    try {
      if (data.amount < 0) {
        return { code: 199, data: null, message: 'negative amount for debit' };
      }

      if (!data.transactionId) {
        return { code: 1504, data: null, message: 'Missing transactionId' };
      }

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        const user = await this.userRepository.findOne({
          where: { id: data.playerId },
          relations: { wallet: true },
        });
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user?.wallet?.balance ?? 0,
          },
          message: 'Duplicate transaction - already processed',
        };
      }

      // Real money at risk during an active bonus is drawn from the
      // isolated bonusBalance first, then the real balance covers the
      // remainder — this is what actually puts bonus funds "at risk" during
      // wagering, instead of bonusBalance being a side counter that never
      // moves. Both rows are locked for the duration so a concurrent
      // debit/credit for the same user can't read stale balances.
      const { oldBalance, newBalance, bonusPortion, realPortion } =
        await this.dataSource.transaction(async (mgr) => {
          const walletRepo = mgr.getRepository(walletEntity);

          const user = await mgr.getRepository(UserEntity).findOne({
            where: { id: data.playerId },
            relations: { wallet: true },
          });
          if (!user) throw new WalletOpError(1501, 'User Not Found');
          if (!user.wallet) throw new WalletOpError(1502, 'Wallet Not Found');

          const wallet = await walletRepo
            .createQueryBuilder('w')
            .setLock('pessimistic_write')
            .where('w.id = :id', { id: user.wallet.id })
            .getOne();
          if (!wallet) throw new WalletOpError(1502, 'Wallet Not Found');

          const activeBonus = await this.lockActiveBonus(mgr, data.playerId);
          const bonusAvailable = activeBonus ? Number(activeBonus.bonusBalance) : 0;

          if (wallet.balance + bonusAvailable < data.amount) {
            throw new WalletOpError(1503, 'Insufficient Funds');
          }

          const bonusPortion = Math.min(bonusAvailable, data.amount);
          const realPortion = data.amount - bonusPortion;

          const oldBalance = wallet.balance;
          wallet.balance = oldBalance - realPortion;
          await walletRepo.save(wallet);

          if (activeBonus && bonusPortion > 0) {
            activeBonus.bonusBalance = bonusAvailable - bonusPortion;
            await mgr.getRepository(UserPromotionEntity).save(activeBonus);
          }

          return {
            oldBalance,
            newBalance: wallet.balance,
            bonusPortion,
            realPortion,
          };
        });

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      await this.transactionService.createTransaction({
        type: TransactionType.DEBIT,
        balanceAfter: newBalance,
        balanceBefore: oldBalance,
        amount: data.amount,
        gameId: data.gameId,
        gameSessionId: findGameSession?.id,
        roundId: data.roundId,
        userId: data.playerId,
        transactionId: data.transactionId,
        reason: bonusPortion > 0 ? `Bonus draw: ${bonusPortion}, Real draw: ${realPortion}` : '',
      });

      await this.wageringService.updateWageringStats(
        data.playerId,
        data.amount,
        TransactionType.DEBIT,
      );
      this.userClient.emit('USER_XP', data.playerId);

      return {
        code: 200,
        data: {
          transactionId: data.transactionId,
          transactionStatus: 1,
          balance: newBalance,
        },
        message: 'Success',
      };
    } catch (error) {
      if (error instanceof WalletOpError) {
        return { code: error.code, data: null, message: error.message };
      }
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // WALLET CREDIT
  async walletCredit(data: CreditRequestDto) {
    console.log('credit data', data);
    try {
      if (data.amount < 0) {
        return { code: 199, data: null, message: 'amount cannot be negative' };
      }

      if (!data.transactionId) {
        return { code: 1504, data: null, message: 'Missing transactionId' };
      }

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        const user = await this.userRepository.findOne({
          where: { id: data.playerId },
          relations: { wallet: true },
        });
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user?.wallet?.balance ?? 0,
          },
          message: 'Duplicate transaction - already processed',
        };
      }

      // Wins while an active bonus is being wagered stay isolated in
      // bonusBalance (still at risk, still counted toward wagering via the
      // BET_SETTLED path) instead of landing in the real balance — real
      // balance is only credited once wagering completes and the remaining
      // bonusBalance is transferred over (see WageringProgressService.complete).
      const { oldBalance, newBalance, wentToBonus } =
        await this.dataSource.transaction(async (mgr) => {
          const walletRepo = mgr.getRepository(walletEntity);

          const user = await mgr.getRepository(UserEntity).findOne({
            where: { id: data.playerId },
            relations: { wallet: true },
          });
          if (!user) throw new WalletOpError(1501, 'User Not Found');
          if (!user.wallet) throw new WalletOpError(1502, 'Wallet Not Found');

          const wallet = await walletRepo
            .createQueryBuilder('w')
            .setLock('pessimistic_write')
            .where('w.id = :id', { id: user.wallet.id })
            .getOne();
          if (!wallet) throw new WalletOpError(1502, 'Wallet Not Found');

          const activeBonus = await this.lockActiveBonus(mgr, data.playerId);

          if (activeBonus) {
            activeBonus.bonusBalance = Number(activeBonus.bonusBalance) + data.amount;
            await mgr.getRepository(UserPromotionEntity).save(activeBonus);
            return { oldBalance: wallet.balance, newBalance: wallet.balance, wentToBonus: true };
          }

          const oldBalance = wallet.balance;
          wallet.balance = oldBalance + data.amount;
          await walletRepo.save(wallet);
          return { oldBalance, newBalance: wallet.balance, wentToBonus: false };
        });

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      await this.transactionService.createTransaction({
        type: wentToBonus ? TransactionType.BONUS : TransactionType.CREDIT,
        balanceAfter: newBalance,
        balanceBefore: oldBalance,
        amount: data.amount,
        gameId: data.gameId,
        gameSessionId: findGameSession?.id,
        roundId: data.roundId,
        userId: data.playerId,
        transactionId: data.transactionId,
        reason: wentToBonus ? 'Win credited to active bonus balance' : '',
      });

      await this.wageringService.updateWageringStats(
        data.playerId,
        data.amount,
        TransactionType.CREDIT,
      );
      this.userClient.emit('USER_XP', data.playerId);

      return {
        code: 200,
        data: {
          transactionId: data.transactionId,
          transactionStatus: 1,
          balance: newBalance,
        },
        message: 'Success',
      };
    } catch (error) {
      if (error instanceof WalletOpError) {
        return { code: error.code, data: null, message: error.message };
      }
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // WALLET ROLLBACK
  // KNOWN LIMITATION: unlike walletDebit/walletCredit, this does not split
  // against an active bonusBalance — it always reverses against the real
  // wallet balance only. A correct bonus-aware reversal needs the original
  // debit/credit's bonus/real split persisted per-transaction (there's no
  // column for that yet), so rolling back a bet that drew from bonusBalance
  // will currently refund the real balance instead of restoring bonusBalance.
  // Low-frequency path (used for cancelled/errored rounds), but flagged here
  // since it's a real gap, not an oversight.
  async walletRollback(data: RollbackRequestDto) {
    console.log('rollback data', data);
    try {
      if (data.amount !== undefined && data.amount < 0) {
        return { code: 199, data: null, message: 'amount cannot be negative' };
      }

      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user || !user.wallet) {
        return { code: 1501, data: null, message: 'User or Wallet Not Found' };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      const existingTransaction = await this.transactionService.checkExiting(
        data.transactionId,
      );

      if (!existingTransaction) {
        await this.transactionService.createTransaction({
          type: TransactionType.ROLLBACK,
          userId: data.playerId,
          transactionId: data.transactionId,
          amount: data.amount,
          balanceAfter: user.wallet.balance,
          balanceBefore: user.wallet.balance,
          gameId: data.gameId,
          gameSessionId: findGameSession?.id,
          reason: data.reason,
          roundId: data.roundId,
        });

        return {
          code: 200,
          data: {
            transactionId: null,
            transactionStatus: 3,
            balance: user.wallet.balance,
          },
          message: 'Rollback recorded - original transaction pending',
        };
      }

      let newBalance = user.wallet.balance;

      if (data.amount !== undefined) {
        newBalance = user.wallet.balance + data.amount;
      } else if (
        data.debitAmount !== undefined ||
        data.creditAmount !== undefined
      ) {
        const debitRefund = data.debitAmount ?? 0;
        const creditRemove = data.creditAmount ?? 0;
        newBalance = user.wallet.balance + (debitRefund - creditRemove);
      } else {
        return {
          code: 199,
          data: null,
          message: 'Bad Request - Missing amount',
        };
      }

      if (newBalance < 0) {
        return {
          code: 1503,
          data: null,
          message: 'Insufficient Funds for rollback',
        };
      }

      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

      await this.wageringService.updateWageringStats(
        data.playerId,
        data.amount,
        TransactionType.ROLLBACK,
      );
      this.userClient.emit('USER_XP', data.playerId);

      return {
        code: 200,
        data: {
          transactionId: data.transactionId,
          transactionStatus: 3,
          balance: newBalance,
        },
        message: 'Success',
      };
    } catch (error) {
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // ADMIN: manual balance adjustment
  async adminAdjustBalance(data: {
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    reason: string;
    adminId: string;
  }) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: data.userId },
        relations: { wallet: true },
      });
      if (!user?.wallet) {
        return { code: 1501, data: null, message: 'User or wallet not found' };
      }

      if (data.amount <= 0) {
        return { code: 199, data: null, message: 'Amount must be positive' };
      }

      const oldBalance = user.wallet.balance;
      let newBalance: number;

      if (data.type === 'credit') {
        newBalance = oldBalance + data.amount;
      } else {
        if (oldBalance < data.amount) {
          return { code: 1503, data: null, message: 'Insufficient funds' };
        }
        newBalance = oldBalance - data.amount;
      }

      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

      const txId = `admin-adj-${data.adminId}-${Date.now()}`;
      await this.transactionService.createTransaction({
        type: TransactionType.ADJUSTMENT,
        userId: data.userId,
        transactionId: txId,
        amount: data.amount,
        balanceBefore: oldBalance,
        balanceAfter: newBalance,
        reason: `[ADMIN:${data.adminId}] ${data.reason}`,
      });

      return {
        code: 200,
        data: { balance: newBalance },
        message: `Balance ${data.type}ed by admin`,
      };
    } catch (err: any) {
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // CREDIT AND DEBIT
  async creditAndDebit(data: DebitAndCreditDto) {
    console.log('credit and debit data', data);
    try {
      if (
        (data.debitAmount !== undefined && data.debitAmount < 0) ||
        (data.creditAmount !== undefined && data.creditAmount < 0)
      ) {
        return { code: 199, data: null, message: 'amounts cannot be negative' };
      }

      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user?.wallet) {
        return { code: 1501, data: null, message: 'User or wallet not found' };
      }

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        return {
          code: 200,
          data: {
            transactionId: isDuplicate.transactionId,
            transactionStatus: 1,
            balance: user.wallet.balance,
          },
          message: 'Success',
        };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      const credit = data.creditAmount ?? 0;
      const debit = data.debitAmount ?? 0;
      const currentBalance = user.wallet.balance;

      if (currentBalance < debit) {
        return {
          code: 1503,
          data: null,
          message: 'Insufficient Funds for debit',
        };
      }

      const newBalance = currentBalance + credit - debit;

      if (newBalance < 0) {
        return {
          code: 1503,
          data: null,
          message: 'Insufficient Funds - balance would be negative',
        };
      }

      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

      await this.transactionService.createTransaction({
        type: TransactionType.DEBIT_AND_CREDIT,
        userId: data.playerId,
        transactionId: data.transactionId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        gameId: data.gameId,
        gameSessionId: findGameSession?.id,
        roundId: data.roundId,
        amount: Math.abs(credit - debit),
        reason: `Debit: ${debit}, Credit: ${credit}`,
      });

      await this.wageringService.updateWageringStats(
        data.playerId,
        0,
        TransactionType.DEBIT_AND_CREDIT,
        { debitAmount: data.debitAmount, creditAmount: data.creditAmount },
      );
      this.userClient.emit('USER_XP', data.playerId);

      return {
        code: 200,
        data: {
          transactionId: null,
          transactionStatus: 1,
          balance: newBalance,
        },
        message: 'Success',
      };
    } catch (error) {
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }
}
