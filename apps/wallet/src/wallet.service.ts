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
  DebitAndCreditDto,
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
    private readonly gameSessionRepository: Repository<GameSession>,

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

  //WALLET BALANCE
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
  //END WALLET BALANCE

  //WALLET DEBIT
  async walletDebit(data: DebitRequestDto) {
    if (data.amount < 0) {
      return {
        code: 1503,
        data: null,
        message: 'amount cannot be negative',
      };
    }

    try {
      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      console.log('Current balance:', user?.wallet?.balance);
      console.log('Debit amount:', data.amount);

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
      const findGameSession = await this.gameSessionRepository.findOne({
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

      if (data.amount > user.wallet.balance) {
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
    if (data.amount < 0) {
      return {
        code: 1503,
        data: null,
        message: 'amount cannot be negative',
      };
    }

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

      const findGameSession = await this.gameSessionRepository.findOne({
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
    if (data.amount !== undefined && data.amount < 0) {
      return {
        code: 1503,
        data: null,
        message: 'amount cannot be negative',
      };
    }
    if (data.debitAmount !== undefined && data.debitAmount < 0) {
      return {
        code: 199,
        data: null,
        message: 'debitAmount cannot be negative',
      };
    }
    if (data.creditAmount !== undefined && data.creditAmount < 0) {
      return {
        code: 199,
        data: null,
        message: 'creditAmount cannot be negative',
      };
    }

    try {
      const existingTransaction = await this.transactionService.checkExiting(
        data.transactionId,
      );
      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user || !user.wallet) {
        return {
          code: 1501,
          data: null,
          message: 'User or Wallet Not Found',
        };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: {
          playerId: data.playerId,
          isActive: true,
        },
      });

      if (!existingTransaction) {
        const balanceAfterCalculation = data.relatedExternalDebitTransactionId
          ? user.wallet.balance - (data.amount ?? 0)
          : user.wallet.balance + (data.amount ?? 0);

        if (balanceAfterCalculation < 0) {
          return {
            code: 1503,
            data: null,
            message: 'Insufficient Funds for rollback',
          };
        }

        await this.transactionService.createTransaction({
          type: TransactionType.ROLLBACK,
          userId: data.playerId,
          transactionId: data.transactionId,
          amount: data.amount,
          balanceAfter: balanceAfterCalculation,
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

      let oldBalance = user.wallet.balance;
      let newBalance = oldBalance;
      let rollbackAmount = 0;

      if (data.amount !== undefined) {
        rollbackAmount = data.amount;
        newBalance = oldBalance + rollbackAmount;
      } else if (
        data.debitAmount !== undefined ||
        data.creditAmount !== undefined
      ) {
        const debitRefund = data.debitAmount ?? 0;
        const creditRemove = data.creditAmount ?? 0;
        rollbackAmount = debitRefund - creditRemove;
        newBalance = oldBalance + (debitRefund - creditRemove);
      } else {
        return {
          code: 199,
          data: null,
          message: 'Bad Request - Missing amount or debitAmount/creditAmount',
        };
      }
      if (newBalance < 0) {
        return {
          code: 1503,
          data: null,
          message:
            'Insufficient Funds for rollback - Balance would become negative',
        };
      }

      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

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
      return {
        code: 1500,
        data: null,
        message: 'Internal Error',
      };
    }
  }
  //END WALLET ROLLBACK

  //CREDIT AND DEBIT
  async creditAndDebit(data: DebitAndCreditDto) {
    if (
      (data.debitAmount !== undefined && data.debitAmount < 0) ||
      (data.creditAmount !== undefined && data.creditAmount < 0)
    ) {
      return {
        code: 199,
        data: null,
        message: 'debitAmount and creditAmount cannot be negative',
      };
    }

    try {
      const existingTransaction = await this.transactionService.checkExiting(
        data.transactionId,
      );

      if (existingTransaction) {
        const user = await this.userRepository.findOne({
          where: { id: data.playerId },
          relations: { wallet: true },
        });
        return {
          code: 200,
          data: {
            transactionId: existingTransaction.transactionId,
            transactionStatus: 1,
            balance: user?.wallet?.balance ?? 0,
          },
          message: 'Success',
        };
      }

      const user = await this.userRepository.findOne({
        where: { id: data.playerId },
        relations: { wallet: true },
      });

      if (!user?.wallet) {
        return {
          code: 1501,
          data: null,
          message: 'User or wallet not found',
        };
      }

      const findGameSession = await this.gameSessionRepository.findOne({
        where: {
          playerId: data.playerId,
          isActive: true,
        },
      });

      const currentBalance = user.wallet.balance;
      const credit = data.creditAmount ?? 0;
      const debit = data.debitAmount ?? 0;

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
          message:
            'Insufficient Funds - Transaction would make balance negative',
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
      return {
        code: 1500,
        data: null,
        message: `Internal Error: `,
      };
    }
  }
  //CREDIT AND DEBIT
}
