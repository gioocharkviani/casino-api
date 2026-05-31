import {
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreditRequestDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { walletEntity } from 'libs/database/entities/wallet.entity';

import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { transactionService } from './transactions/transaction.service';
import { TransactionType } from 'libs/common';
import { GameSession } from 'libs/database/entities/game.entity';

@Injectable()
export class WalletService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(walletEntity)
    private readonly walletRepository: Repository<walletEntity>,
    @InjectRepository(GameSession)
    private readonly gameRepository: Repository<GameSession>,

    private readonly transactionService: transactionService,
    private readonly configService: ConfigService,
  ) {}

  // WALLET AUTH
  async walletAuth(data: WalletAuthDto) {
    const tokenValidationReq = await lastValueFrom(
      this.client.send('VALIDATE_GAME_SESSION', data.token),
    );
    if (!tokenValidationReq.valid) {
      return {
        code: 1403,
        message: 'Unauthorized wallet',
        data: null,
      };
    }
    const userData = await this.userRepository.findOne({
      where: {
        id: tokenValidationReq.data.playerId,
      },
      relations: {
        country: true,
        wallet: true,
      },
      select: {
        country: true,
        wallet: true,
      },
    });

    const resData = {
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
    };

    return {
      code: 200,
      data: resData,
      message: 'Success',
    };
  }
  // END WALLET AUTH

  //WALLET BALLANCE
  async getWalletBallance(data: WalletBallanceDto) {
    const findWalletUser = await this.userRepository.findOne({
      where: {
        id: data.playerId,
      },
      relations: {
        wallet: true,
      },
    });

    if (!findWalletUser) {
      return {
        code: 401,
        data: {},
        message: 'Unauthorized',
      };
    }

    return {
      code: 200,
      data: {
        balance: findWalletUser.wallet?.balance || 0,
        sessionState: null,
      },
      message: 'Success',
    };
  }
  //END WALLET BALLANCE

  //WALLET DEBIT
  async walletDebit(data: DebitRequestDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!data.transactionId) {
        return {
          code: 1504,
          data: null,
          message: 'Missing transactionId',
        };
      }

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );

      if (isDuplicate) {
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user?.wallet?.balance || 0,
          },
          message: 'Duplicate transaction - already processed',
        };
      }
      const findGameSession = await this.gameRepository.findOne({
        where: {
          playerId: data.playerId,
          isActive: true,
        },
      });

      if (!user) {
        return {
          code: 1501,
          data: null,
          message: 'User Not Found',
        };
      }

      if (!user.wallet) {
        return {
          code: 1502,
          data: null,
          message: 'Wallet Not Found',
        };
      }

      if (user.wallet.balance < data.amount) {
        return {
          code: 1503,
          data: null,
          message: 'Insufficient Funds',
        };
      }

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
      console.error('Debit error:', error);
      return {
        code: 1500,
        data: null,
        message: 'Internal Error',
      };
    }
  }
  //END WALLET DEBIT

  //WALLET CREDIT
  async walletCredit(data: CreditRequestDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user) {
        return {
          code: 1501,
          data: null,
          message: 'User Not Found',
        };
      }

      if (!user.wallet) {
        return {
          code: 1502,
          data: null,
          message: 'Wallet Not Found',
        };
      }

      if (!data.transactionId) {
        return {
          code: 1504,
          data: null,
          message: 'Missing transactionId',
        };
      }

      const isDuplicate = await this.transactionService.checkExiting(
        data.transactionId,
      );
      if (isDuplicate) {
        return {
          code: 200,
          data: {
            transactionId: data.transactionId,
            transactionStatus: 1,
            balance: user?.wallet?.balance || 0,
          },
          message: 'Duplicate transaction - already processed',
        };
      }

      const findGameSession = await this.gameRepository.findOne({
        where: {
          playerId: data.playerId,
          isActive: true,
        },
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
      console.error('credit error:', error);
      return {
        code: 1500,
        data: null,
        message: 'Internal Error',
      };
    }
  }

  //END WALLET CREDIT

  //WALLET ROLLBACK
  async walletRollback(data: RollbackRequestDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user || !user.wallet) {
        return { code: 1501, data: null, message: 'User or Wallet Not Found' };
      }
      const existingTransaction = await this.transactionService.checkExiting(
        data.transactionId,
      );

      if (existingTransaction?.type === TransactionType.ROLLBACK) {
        return {
          code: 200,
          data: {
            transactionId: null,
            transactionStatus: 3,
            balance: user.wallet.balance,
          },
          message: 'Transaction already rolled back',
        };
      }

      let oldBalance = user.wallet.balance;
      let newBalance = oldBalance;
      let rollbackAmount = 0;
      console.log('test1');

      if (data.relatedExternalDebitTransactionId) {
        if (existingTransaction?.type === TransactionType.CREDIT) {
          rollbackAmount = -(existingTransaction.amount ?? 0);
          newBalance = oldBalance - (existingTransaction.amount ?? 0);
        } else {
          rollbackAmount = -(data.amount ?? 0);
          newBalance = oldBalance - (data.amount ?? 0);
        }
      } else {
        if (existingTransaction?.type === TransactionType.DEBIT) {
          rollbackAmount = existingTransaction.amount ?? 0;
          newBalance = oldBalance + (existingTransaction.amount ?? 0);
        } else {
          rollbackAmount = data.amount ?? 0;
          newBalance = oldBalance + (data.amount ?? 0);
        }
      }
      console.log('test2');

      if (newBalance !== oldBalance) {
        user.wallet.balance = newBalance;
        await this.walletRepository.save(user.wallet);
      }

      const findGameSession = await this.gameRepository.findOne({
        where: { playerId: data.playerId, isActive: true },
      });

      await this.transactionService.createTransaction({
        type: TransactionType.ROLLBACK,
        balanceAfter: newBalance,
        balanceBefore: oldBalance,
        amount: Math.abs(rollbackAmount),
        gameId: data.gameId,
        gameSessionId: findGameSession?.id,
        roundId: data.roundId,
        userId: data.playerId,
        transactionId: data.transactionId,
        reason: data.reason || 'Rollback performed',
      });
      console.log('test3');
      return {
        code: 200,
        data: {
          transactionId:
            existingTransaction?.transactionId || data.transactionId,
          transactionStatus: 3,
          balance: newBalance,
        },
        message: 'Success',
      };
    } catch (error) {
      console.log('test error');
      console.error('Rollback error:', error);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }
}
