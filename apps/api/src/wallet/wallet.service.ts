import { Inject, Injectable } from '@nestjs/common';
import { WalletAuthDto } from './dto/wallet.dto';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WalletService {
  constructor(@Inject('WALLET_M_SERVICE') private client: ClientProxy) {}

  //WALLET AUTH SERVICE
  async walletAuth(data: WalletAuthDto) {
    const result = await lastValueFrom(this.client.send('WALLET_AUTH', data));
    return result;
  }
  //WALLET AUTH SERVICE
}
