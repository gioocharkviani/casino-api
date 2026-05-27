import { Inject, Injectable } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';
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
  async balance(data) {
    return data;
  }
  //WALLET PLAYER BALANCE

  //WALLET DEBIT
  async debit(data) {
    return data;
  }
  //WALLET DEBIT

  //WALLET CREDIT
  async credit(data) {
    return data;
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
