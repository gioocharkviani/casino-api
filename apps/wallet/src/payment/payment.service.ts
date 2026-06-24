import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { Repository } from 'typeorm';
import { transactionService } from '../transactions/transaction.service';
import {
  depositDto,
  payInExtraDto,
  withdrawalDto,
} from 'libs/common/dto/payment.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { TransactionStatusEnum, TransactionType } from 'libs/common';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('USER_MS_SERVICE') private userClient: ClientProxy,
    @InjectRepository(walletEntity)
    private readonly walletRepo: Repository<walletEntity>,
    private readonly transactionService: transactionService,
    private readonly configService: ConfigService,
  ) {}

  //MERCHANT CONFIG
  private async getPayinExtraConfig() {
    const baseUrl = await this.configService.get('PAYMENT_EXTRA_BASE_URL');
    const merchantId = await this.configService.get('PAYMENT_EXTRA_ID');
    const apiKey = await this.configService.get('PAYMENT_EXTRA_API_KEY');
    const secret = await this.configService.get('PAYMENT_EXTRA_API_SECRET');

    const idempotencyKey = randomUUID();

    if (!baseUrl || !merchantId || !apiKey) {
      throw new RpcException({
        message: 'Payment provider is not configured',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
    return { baseUrl, merchantId, apiKey, idempotencyKey, secret };
  }

  //DEPOIST SERVICE
  async deposit(data: depositDto) {
    const { baseUrl, merchantId, apiKey, idempotencyKey, secret } =
      await this.getPayinExtraConfig();
    const user = await lastValueFrom(
      this.userClient.send('GET_USER', data.token),
    );

    if (!user) {
      throw new RpcException({
        message: 'Unauthorized user',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
    const formattedMonth = String(data.cardExpMonth).padStart(2, '0');
    const formattedCardNumber = data.cardNumber?.replace(/\s/g, '') ?? '';
    const reqBody = {
      amount: data.amount,
      currency: this.configService.get('DEFAULT_CURRENCY'),
      paymentMethod: 'bank_transfer',
      merchantReference: `order-${user.id}-${idempotencyKey}`,
      customer: {
        name: user.firstName,
        email: user.email,
        reference: `user-${user.id}`,
      },
      // cardDetails: {
      //   cardNumber: formattedCardNumber,
      //   cardholderName: data.cardholderName,
      //   cardExpMonth: formattedMonth,
      //   cardExpYear: data.cardExpYear,
      //   cvv: data.cvv,
      // },
      metadata: {
        orderType: 'subscription',
      },
    };
    console.log(reqBody);
    const headers = this.buildHeaders(apiKey, merchantId, apiKey);
    const endpoint = `${baseUrl}/payments/deposits`;

    try {
      const req = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(reqBody),
      });

      const res = await req.json();
      return res;
    } catch (error) {
      console.log(error);
      throw new RpcException('something whent wrong');
    }

    // const saveTransaction = await this.transactionService.createTransaction({
    //   amount: data.amount,
    //   type: TransactionType.DEPOSIT,
    //   status: res.status || TransactionStatusEnum.PENDING,
    //   balanceAfter: user.wallet.balance,
    //   balanceBefore: user.wallet.balance + data.amount,
    //   paymentId: res.paymentId || '12312321',
    //   transactionId: res.paymentId || '3243',
    //   userId: user.id,
    //   reason: 'DEPOSIT money with card ',
    // });
  }

  //WITHDRAWAL SERVICE
  async withdrawal(data: withdrawalDto) {
    const PAYEMENT_BASE_URL = this.configService.get('PAYMENT_EXTRA_BASE_URL');
    const MERCHANT_ID = this.configService.get('PAYMENT_EXTRA_ID');
    const API_KEY = this.configService.get('PAYMENT_EXTRA_API_KEY');
    const user = await lastValueFrom(
      this.userClient.send('GET_USER', data.token),
    );
    if (!user) {
      throw new RpcException({
        message: 'Unauthorized user',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }
    return 'withdrawal';
  }

  ///////////////////////////////////////////////////////////////
  //BUILD HEADERS HELPER
  private buildHeaders(
    apiKey: string,
    merchantId: string,
    apiSecret?: string,
    idempotencyKey?: string,
  ) {
    const headers: any = {
      'X-API-Key': apiKey,
      'X-Merchant-Id': merchantId,
      'X-Idempotency-Key': idempotencyKey,
    };

    if (apiSecret) {
      headers['X-API-Secret'] = apiSecret;
    }

    return headers;
  }

  ///////////////////////////////////////////////////////////////
}
