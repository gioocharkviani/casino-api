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
  DebitRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { UserEntity } from 'libs/database/entities/user.entity';

import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
    return data;
  }
  //END WALLET DEBIT
}
