import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { lastValueFrom } from 'rxjs';
import { Repository } from 'typeorm';

@Injectable()
export class WalletService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // WALLET AUTH
  async walletAuth(data: WalletAuthDto) {
    const tokenValidationReq = await lastValueFrom(
      this.client.send('VALIDATE_GAME_SESSION', data.token),
    );
    if (!tokenValidationReq.valid) {
      return new UnauthorizedException('unauthorized wallet');
    }
    const userData = await this.userRepository.findOne({
      where: {
        id: tokenValidationReq.data.playerId,
      },
      relations: {
        wallet: true,
      },
      select: {
        wallet: true,
      },
    });
    const resData = {
      playerId: userData?.id,
      currency: 'GBP',
      language: 'en',
      nickname: userData?.userName,
      balance: userData?.wallet?.balance,
      license: 'MT',
      countryCode: 'HR',
      sessionState: {},
      brand: 'website-1',
      additionalData: {},
    };
    return {
      status: 200,
      data: resData,
      message: 'Success',
    };
  }
  // END WALLET AUTH
}
