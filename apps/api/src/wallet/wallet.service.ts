import { Inject, Injectable } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { depositDto, PayInExtraWebhookDto } from 'libs/common/dto/payment.dto';
import {
  CreditRequestDto,
  DebitAndCreditDto,
  DebitRequestDto,
  RollbackRequestDto,
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
  async rollback(data: RollbackRequestDto) {
    const result = await lastValueFrom(
      this.client.send('WALLET_ROLLBACK', data),
    );
    return result;
  }
  //WALLET ROLLBACK

  //WALLET DEBIT AND CREDIT
  async debitAndCredit(data: DebitAndCreditDto) {
    const result = await lastValueFrom(this.client.send('DEBIT_CREDIT', data));
    return result;
  }
  //WALLET DEBIT AND CREDIT

  // NUXGAME CALLBACKS
  async nuxgamePlayerDetails(userId: string, token: string) {
    return await lastValueFrom(
      this.client.send('NUXGAME_PLAYER_DETAILS', { userId, token }),
    );
  }

  async nuxgameSessionCheck(userId: string, token: string) {
    return await lastValueFrom(
      this.client.send('NUXGAME_SESSION_CHECK', { userId, token }),
    );
  }

  async nuxgameGetBalance(userId: string, token: string) {
    return await lastValueFrom(
      this.client.send('NUXGAME_GET_BALANCE', { userId, token }),
    );
  }

  async nuxgameMoveFunds(data: any) {
    return await lastValueFrom(this.client.send('NUXGAME_MOVE_FUNDS', data));
  }

  //DEPOSIT
  async deposit(data: depositDto) {
    console.log(data);
    const result = await lastValueFrom(
      this.client.send('WALLET_DEPOSIT', data),
    );
    return result;
  }
  //DEPOSIT

  //DEPOSIT
  async withdrawal(data: any) {
    const result = await lastValueFrom(
      this.client.send('WALLET_WITHDRAWAL', data),
    );
    return result;
  }
  //DEPOSIT

  //USER TRANSACTIONS
  async userTansactions(token: string) {
    const result = await lastValueFrom(
      this.client.send('GET_USER_TRANSACTIONS', token),
    );
    return result;
  }
  //USER TRANSACTIONS

  // PAYMENT WEBHOOK
  async handlePaymentWebhook(payload: PayInExtraWebhookDto & { webhookSecret: string }) {
    const result = await lastValueFrom(
      this.client.send('PAYMENT_WEBHOOK', payload),
    );
    return result;
  }
}
