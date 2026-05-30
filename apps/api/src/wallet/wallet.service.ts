import { Inject, Injectable } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import {
  CreditRequestDto,
  DebitRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
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

  //WALLET PLAYER BALANCE
  async balance(data: WalletBallanceDto) {
    const result = await lastValueFrom(
      this.client.send('WALLET_BALANCE', data),
    );
    return result;
  }
  //WALLET PLAYER BALANCE

  //WALLET DEBIT
  async debit(data: DebitRequestDto) {
    const result = await lastValueFrom(this.client.send('WALLET_DEBIT', data));
    return result;
  }
  //WALLET DEBIT

  //WALLET CREDIT
  async credit(data: CreditRequestDto) {
    const result = await lastValueFrom(this.client.send('WALLET_CREDIT', data));
    return result;
  }
  //WALLET CREDIT

  //WALLET ROLLBACK
  async rollback(data) {
    return data;
  }
  //WALLET ROLLBACK

  //WALLET DEBIT AND CREDIT
  async debitAndCredit(data) {
    return data;
  }
  //WALLET DEBIT AND CREDIT
}
