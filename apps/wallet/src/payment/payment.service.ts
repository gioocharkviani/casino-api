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

    const customerName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
    const reqBody: Record<string, any> = {
      amount: data.amount,
      currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
      paymentMethod: 'bank_transfer',
      merchantReference,
      customer: {
        name: customerName,
        email: user.email,
        phone: user.phone ?? '',
        reference: `user-${user.id}`,
        identificationNumber: user.personalId || '00000000000',
      },
      metadata: { orderType: 'deposit', userId: user.id },
    };

    const headers = this.buildHeaders(
      apiKey,
      merchantId,
      idempotencyKey,
      secret,
    );
    const endpoint = `${baseUrl}/payments/deposits`;

    // Save transaction before calling the provider
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

      const res = await req.json();

      if (!req.ok) {
        const errMsg = res?.message || res?.error || JSON.stringify(res);
        console.error('[Payment] Deposit rejected by PayInExtra:', req.status, errMsg, JSON.stringify(res));
        await this.transactionRepo.update(savedTx.id, {
          status: TransactionStatusEnum.FAILD,
          reason: errMsg?.slice(0, 250) || 'PayInExtra rejected the request',
        });
        return {
          code: req.status,
          data: null,
          message: errMsg || 'Deposit request failed',
          providerResponse: res,
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
    const { idempotencyKey } = await this.getPayinExtraConfig();

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

    if (data.amount <= 0) {
      return { code: 199, data: null, message: 'Amount must be positive' };
    }

    if (wallet.balance < data.amount) {
      return {
        code: 1503,
        data: null,
        message: 'Insufficient funds for withdrawal',
      };
    }

    const merchantReference = `withdrawal-${user.id}-${idempotencyKey}`;
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const holderName = data.accountHolderName ?? (fullName || user.email);

    // Deduct balance immediately (prevents double-withdrawal), then await admin approval
    const balanceBefore = wallet.balance;
    wallet.balance = balanceBefore - data.amount;
    await this.walletRepo.save(wallet);

    await this.transactionService.createTransaction({
      amount: data.amount,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatusEnum.PENDING,
      balanceBefore,
      balanceAfter: wallet.balance,
      paymentId: merchantReference,
      transactionId: merchantReference,
      userId: user.id,
      reason: `PENDING_WITHDRAWAL|iban:${data.iban}|holder:${holderName}|ref:${merchantReference}`,
    });

    return {
      code: 200,
      data: { merchantReference },
      message: 'Withdrawal request submitted — awaiting admin approval',
    };
  }

  // ── ADMIN: APPROVE WITHDRAWAL ─────────────────────────────────────────────
  async adminApproveWithdrawal(txId: string) {
    const tx = await this.transactionRepo.findOne({ where: { id: txId } });
    if (!tx || tx.type !== TransactionType.WITHDRAWAL || tx.status !== TransactionStatusEnum.PENDING) {
      return { code: 400, data: null, message: 'Transaction not found or not a pending withdrawal' };
    }

    // Parse withdrawal data stored in reason field
    const parts: Record<string, string> = {};
    (tx.reason ?? '').split('|').forEach(part => {
      const idx = part.indexOf(':');
      if (idx > -1) parts[part.slice(0, idx)] = part.slice(idx + 1);
    });

    const iban = parts['iban'];
    const holderName = parts['holder'] ?? '';

    if (!iban) {
      return { code: 400, data: null, message: 'IBAN not found in transaction data' };
    }

    let config: Awaited<ReturnType<typeof this.getPayinExtraConfig>>;
    try {
      config = await this.getPayinExtraConfig();
    } catch {
      return { code: 500, data: null, message: 'Payment provider is not configured' };
    }

    const { baseUrl, merchantId, apiKey, idempotencyKey, secret } = config;

    const reqBody = {
      amount: tx.amount,
      currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
      merchantReference: tx.paymentId,
      payoutMethod: 'havale',
      destination: { accountName: holderName, iban },
      metadata: { userId: tx.userId },
    };

    const hdrs = this.buildHeaders(apiKey, merchantId, idempotencyKey, secret);

    try {
      const req = await fetch(`${baseUrl}/payments/withdrawals`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify(reqBody),
      });
      const res = await req.json();

      if (!req.ok) {
        // Refund balance — provider rejected
        const wallet = await this.findWallet(tx.userId);
        if (wallet && tx.amount) {
          wallet.balance = Number(wallet.balance) + Number(tx.amount);
          await this.walletRepo.save(wallet);
          await this.transactionRepo.update(txId, {
            status: TransactionStatusEnum.FAILD,
            reason: `Admin approved but PayInExtra rejected: ${res?.message ?? 'unknown'}`,
            balanceAfter: wallet.balance,
          });
        }
        console.error('[Payment] Withdrawal approval rejected by PayInExtra:', req.status, res);
        return { code: req.status, data: null, message: res?.message || 'PayInExtra rejected withdrawal' };
      }

      await this.transactionRepo.update(txId, {
        status: TransactionStatusEnum.PROCESSING,
        reason: `Admin approved — submitted to bank | iban:${iban}`,
      });

      return { code: 200, data: { paymentId: res.paymentId }, message: 'Withdrawal approved and submitted to bank' };
    } catch (err: any) {
      return { code: 500, data: null, message: `Network error: ${err?.message}` };
    }
  }

  // ── ADMIN: REJECT WITHDRAWAL ──────────────────────────────────────────────
  async adminRejectWithdrawal(txId: string, reason: string) {
    const tx = await this.transactionRepo.findOne({ where: { id: txId } });
    if (!tx || tx.type !== TransactionType.WITHDRAWAL || tx.status !== TransactionStatusEnum.PENDING) {
      return { code: 400, data: null, message: 'Transaction not found or not a pending withdrawal' };
    }

    const wallet = await this.findWallet(tx.userId);
    if (wallet && tx.amount) {
      wallet.balance = Number(wallet.balance) + Number(tx.amount);
      await this.walletRepo.save(wallet);
      await this.transactionRepo.update(txId, {
        status: TransactionStatusEnum.FAILD,
        reason: `Rejected by admin: ${reason}`,
        balanceAfter: wallet.balance,
      });
    }

    return { code: 200, data: null, message: 'Withdrawal rejected and balance refunded' };
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
