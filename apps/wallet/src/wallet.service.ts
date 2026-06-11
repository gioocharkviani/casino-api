import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
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
import { Repository } from 'typeorm';
import { transactionService } from './transactions/transaction.service';
import { WageringService } from 'libs/common/services/wagering.service';
import { lastValueFrom } from 'rxjs';

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
    private readonly transactionService: transactionService,
    private readonly configService: ConfigService,
    private readonly wageringService: WageringService,
  ) {}

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
        currency: this.configService.get('DEFAULT_CURRENCY') || 'USD',
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
    try {
      if (data.amount < 0) {
        return { code: 199, data: null, message: 'negative amount for debit' };
      }

      if (!data.transactionId) {
        return { code: 1504, data: null, message: 'Missing transactionId' };
      }

      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user) return { code: 1501, data: null, message: 'User Not Found' };
      if (!user.wallet)
        return { code: 1502, data: null, message: 'Wallet Not Found' };

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user.wallet.balance,
          },
          message: 'Duplicate transaction - already processed',
        };
      }

      if (user.wallet.balance < data.amount) {
        return { code: 1503, data: null, message: 'Insufficient Funds' };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      const oldBalance = user.wallet.balance;
      const newBalance = oldBalance - data.amount;
      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

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
        reason: '',
      });

      await this.wageringService.updateWageringStats(
        data.playerId,
        data.amount,
        TransactionType.DEBIT,
      );
      this.userClient.send('USER_XP', { userId: data.playerId });

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
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // WALLET CREDIT
  async walletCredit(data: CreditRequestDto) {
    try {
      if (data.amount < 0) {
        return { code: 199, data: null, message: 'amount cannot be negative' };
      }

      if (!data.transactionId) {
        return { code: 1504, data: null, message: 'Missing transactionId' };
      }

      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user) return { code: 1501, data: null, message: 'User Not Found' };
      if (!user.wallet)
        return { code: 1502, data: null, message: 'Wallet Not Found' };

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user.wallet.balance,
          },
          message: 'Duplicate transaction - already processed',
        };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      const oldBalance = user.wallet.balance;
      const newBalance = oldBalance + data.amount;
      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

      await this.transactionService.createTransaction({
        type: TransactionType.CREDIT,
        balanceAfter: newBalance,
        balanceBefore: oldBalance,
        amount: data.amount,
        gameId: data.gameId,
        gameSessionId: findGameSession?.id,
        roundId: data.roundId,
        userId: data.playerId,
        transactionId: data.transactionId,
        reason: '',
      });

      await this.wageringService.updateWageringStats(
        data.playerId,
        data.amount,
        TransactionType.CREDIT,
      );
      this.userClient.send('USER_XP', { userId: data.playerId });

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
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // WALLET ROLLBACK
  async walletRollback(data: RollbackRequestDto) {
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
      this.userClient.send('USER_XP', { userId: data.playerId });

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

  // CREDIT AND DEBIT
  async creditAndDebit(data: DebitAndCreditDto) {
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
      this.userClient.send('USER_XP', { userId: data.playerId });

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
