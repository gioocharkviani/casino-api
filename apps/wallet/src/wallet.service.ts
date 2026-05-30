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
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { walletEntity } from 'libs/database/entities/wallet.entity';

import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(walletEntity)
    private readonly walletRepository: Repository<walletEntity>,
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
      console.log('old balance debit' + oldBalance);
      const newBalance = oldBalance - data.amount;
      console.log('new balance debit' + newBalance);

      user.wallet.balance = newBalance;
      await this.walletRepository.save(user.wallet);

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

  //TODO ჩამოჭრა შევინახოთ ტრანზაქციებში
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

      const oldBalance = user.wallet.balance;
      console.log('old balance credit' + oldBalance);
      const newBalance = oldBalance + data.amount;
      console.log('new balance credit' + newBalance);
      user.wallet.balance = newBalance;

      await this.walletRepository.save(user.wallet);

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
  //TODO დეპოზიტი შევინახოთ ტრანზაქციებში
  //END WALLET CREDIT
}
