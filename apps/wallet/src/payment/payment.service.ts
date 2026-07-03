import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { walletEntity } from 'libs/database/entities/wallet.entity';
import { Repository } from 'typeorm';
import { transactionService } from '../transactions/transaction.service';
import {
  depositDto,
  withdrawalDto,
  PayInExtraWebhookDto,
} from 'libs/common/dto/payment.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { TransactionStatusEnum, TransactionType } from 'libs/common';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('USER_MS_SERVICE') private userClient: ClientProxy,
    @InjectRepository(walletEntity)
    private readonly walletRepo: Repository<walletEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    private readonly transactionService: transactionService,
    private readonly configService: ConfigService,
  ) {}

  // ── CONFIG ────────────────────────────────────────────────────────────────
  private async getPayinExtraConfig() {
    const baseUrl = this.configService.get<string>('PAYMENT_EXTRA_BASE_URL');
    const merchantId = this.configService.get<string>('PAYMENT_EXTRA_ID');
    const apiKey = this.configService.get<string>('PAYMENT_EXTRA_API_KEY');
    const secret = this.configService.get<string>('PAYMENT_EXTRA_API_SECRET');
    const idempotencyKey = randomUUID();

    if (!baseUrl || !merchantId || !apiKey) {
      throw new RpcException({
        message: 'Payment provider is not configured',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
    return { baseUrl, merchantId, apiKey, idempotencyKey, secret };
  }

  private buildHeaders(
    apiKey: string,
    merchantId: string,
    idempotencyKey: string,
    apiSecret?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'X-API-Key': apiKey,
      'X-Merchant-Id': merchantId,
      'X-Idempotency-Key': idempotencyKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (apiSecret) {
      headers['X-API-Secret'] = apiSecret;
    }
    return headers;
  }

  // walletEntity has a OneToOne with JoinColumn(name: 'userId') - use QB to find by FK
  private findWallet(userId: string) {
    return this.walletRepo
      .createQueryBuilder('wallet')
      .where('wallet.userId = :userId', { userId })
      .getOne();
  }

  // ── DEPOSIT ───────────────────────────────────────────────────────────────
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

    const wallet = await this.findWallet(user.id);
    if (!wallet) {
      throw new RpcException({
        message: 'Wallet not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const merchantReference = `order-${user.id}-${idempotencyKey}`;
    const formattedMonth = String(data.cardExpMonth ?? 1).padStart(2, '0');
    const formattedCardNumber = data.cardNumber?.replace(/\s/g, '') ?? '';

    const reqBody: Record<string, any> = {
      amount: data.amount,
      currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
      paymentMethod: 'credit_card_international',
      merchantReference,
      customer: {
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        reference: `user-${user.id}`,
        identificationNumber: user.personalId || '00000000000',
      },
      metadata: { orderType: 'deposit' },
    };

    if (formattedCardNumber) {
      reqBody.cardDetails = {
        cardNumber: formattedCardNumber,
        cardholderName:
          data.cardholderName ?? `${user.firstName} ${user.lastName}`,
        cardExpMonth: formattedMonth,
        cardExpYear: String(data.cardExpYear ?? ''),
        cvv: data.cvv ?? '',
      };
    }

    const headers = this.buildHeaders(
      apiKey,
      merchantId,
      idempotencyKey,
      secret,
    );
    const endpoint = `${baseUrl}/payments/deposits`;

    // Save a PENDING transaction before calling the provider
    const savedTx = await this.transactionService.createTransaction({
      amount: data.amount,
      type: TransactionType.DEPOSIT,
      status: TransactionStatusEnum.PENDING,
      balanceAfter: wallet.balance,
      balanceBefore: wallet.balance,
      paymentId: merchantReference,
      transactionId: merchantReference,
      userId: user.id,
      reason: 'Deposit via PayInExtra',
    });

    try {
      const req = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });
      console.log('req', req);
      const res = await req.json();
      console.log('res', res);

      if (!req.ok) {
        await this.transactionRepo.update(savedTx.id, {
          status: TransactionStatusEnum.FAILD,
          reason: res?.message || 'PayInExtra rejected the request',
        });
        return {
          code: req.status,
          data: null,
          message: res?.message || 'Deposit request failed',
        };
      }

      await this.transactionRepo.update(savedTx.id, {
        paymentId: res.paymentId ?? merchantReference,
        status: TransactionStatusEnum.PROCESSING,
      });

      return {
        code: 200,
        data: {
          paymentPageUrl: res.paymentPageUrl,
          paymentId: res.paymentId,
          merchantReference,
        },
        message: 'Deposit initiated — redirect user to paymentPageUrl',
      };
    } catch (error) {
      await this.transactionRepo.update(savedTx.id, {
        status: TransactionStatusEnum.FAILD,
        reason: 'Network error contacting payment provider',
      });
      throw new RpcException({
        message: 'Payment provider unreachable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }

  // ── WITHDRAWAL ────────────────────────────────────────────────────────────
  async withdrawal(data: withdrawalDto) {
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

    const wallet = await this.findWallet(user.id);
    if (!wallet) {
      throw new RpcException({
        message: 'Wallet not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    if (wallet.balance < data.amount) {
      return {
        code: 1503,
        data: null,
        message: 'Insufficient funds for withdrawal',
      };
    }

    if (data.amount <= 0) {
      return { code: 199, data: null, message: 'Amount must be positive' };
    }

    const merchantReference = `withdrawal-${user.id}-${idempotencyKey}`;

    const reqBody = {
      amount: data.amount,
      currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
      merchantReference,
      customer: {
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        reference: `user-${user.id}`,
      },
      destination: {
        type: 'bank_transfer',
        iban: data.iban,
        accountHolderName:
          data.accountHolderName ??
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      },
    };

    // Deduct balance immediately and record PROCESSING transaction
    const balanceBefore = wallet.balance;
    wallet.balance = balanceBefore - data.amount;
    await this.walletRepo.save(wallet);

    const savedTx = await this.transactionService.createTransaction({
      amount: data.amount,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatusEnum.PROCESSING,
      balanceBefore,
      balanceAfter: wallet.balance,
      paymentId: merchantReference,
      transactionId: merchantReference,
      userId: user.id,
      reason: `Withdrawal to IBAN: ${data.iban}`,
    });

    const headers = this.buildHeaders(
      apiKey,
      merchantId,
      idempotencyKey,
      secret,
    );
    const endpoint = `${baseUrl}/payments/withdrawals`;

    try {
      const req = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(reqBody),
      });

      const res = await req.json();

      if (!req.ok) {
        // Reverse the balance deduction on provider rejection
        wallet.balance = balanceBefore;
        await this.walletRepo.save(wallet);
        await this.transactionRepo.update(savedTx.id, {
          status: TransactionStatusEnum.FAILD,
          reason: res?.message || 'PayInExtra rejected withdrawal',
          balanceAfter: balanceBefore,
        });
        return {
          code: req.status,
          data: null,
          message: res?.message || 'Withdrawal request failed',
        };
      }

      return {
        code: 200,
        data: { paymentId: res.paymentId, merchantReference },
        message: 'Withdrawal submitted — processing by bank',
      };
    } catch (error) {
      // Reverse balance deduction on network failure
      wallet.balance = balanceBefore;
      await this.walletRepo.save(wallet);
      await this.transactionRepo.update(savedTx.id, {
        status: TransactionStatusEnum.FAILD,
        reason: 'Network error contacting payment provider',
        balanceAfter: balanceBefore,
      });
      throw new RpcException({
        message: 'Payment provider unreachable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }

  // ── WEBHOOK HANDLER ───────────────────────────────────────────────────────
  async handleWebhook(data: PayInExtraWebhookDto & { webhookSecret: string }) {
    const configuredSecret = this.configService.get<string>(
      'PAYMENT_EXTRA_WEBHOOK_SECRET',
    );

    if (configuredSecret && data.webhookSecret !== configuredSecret) {
      return { code: 401, message: 'Invalid webhook secret' };
    }

    // Find the pending/processing transaction by paymentId or merchantReference
    const tx = await this.transactionRepo.findOne({
      where: { paymentId: data.paymentId },
    });

    if (!tx) {
      return { code: 404, message: 'Transaction not found' };
    }

    if (tx.status === TransactionStatusEnum.SUCCEEDED) {
      return { code: 200, message: 'Already processed' };
    }

    if (data.status === 'SUCCEEDED') {
      const wallet = await this.findWallet(tx.userId);
      if (!wallet) {
        return { code: 404, message: 'Wallet not found' };
      }

      if (tx.type === TransactionType.DEPOSIT) {
        const txAmount = tx.amount ?? 0;
        const balanceBefore = wallet.balance;
        wallet.balance = balanceBefore + txAmount;
        await this.walletRepo.save(wallet);
        await this.transactionRepo.update(tx.id, {
          status: TransactionStatusEnum.SUCCEEDED,
          balanceBefore,
          balanceAfter: wallet.balance,
        });
        // return trigger data so API layer can fire promo trigger
        return {
          code: 200,
          message: 'Webhook processed',
          triggerData: {
            userId: tx.userId,
            amount: txAmount,
            eventType: 'deposit',
          },
        };
      } else if (tx.type === TransactionType.WITHDRAWAL) {
        await this.transactionRepo.update(tx.id, {
          status: TransactionStatusEnum.SUCCEEDED,
        });
      }
    } else if (data.status === 'FAILED') {
      if (tx.type === TransactionType.WITHDRAWAL) {
        // Refund the deducted balance on withdrawal failure
        const wallet = await this.findWallet(tx.userId);
        if (wallet) {
          wallet.balance = wallet.balance + (tx.amount ?? 0);
          await this.walletRepo.save(wallet);
        }
      }
      await this.transactionRepo.update(tx.id, {
        status: TransactionStatusEnum.FAILD,
        reason: data.failureReason || 'Payment failed',
      });
    } else {
      await this.transactionRepo.update(tx.id, {
        status: TransactionStatusEnum.PROCESSING,
      });
    }

    return { code: 200, message: 'Webhook processed' };
  }
}
