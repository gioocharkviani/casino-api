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
  //DEPOSIT SERVICE
  async deposit(data: depositDto) {
    try {
      const { baseUrl, merchantId, apiKey, secret } =
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

      // Generate unique idempotency key (UUID v4 recommended)
      const idempotencyKey = randomUUID();

      // Format card expiration month to 2 digits (01-12)
      const formattedMonth = String(data.cardExpMonth).padStart(2, '0');

      const cleanCardNumber = data.cardNumber?.replace(/\s/g, '');

      const reqBody = {
        amount: data.amount,
        currency: this.configService.get('DEFAULT_CURRENCY') || 'TRY',
        paymentMethod: 'credit_card_international', // or 'credit_card_tr'
        merchantReference: `order-${user.id}-${Date.now()}`,
        customer: {
          name: user.firstName || user.name || 'Customer',
          email: user.email,
          reference: `user-${user.id}`,
        },
        cardDetails: {
          cardNumber: cleanCardNumber,
          cardholderName: data.cardholderName?.toUpperCase(),
          cardExpMonth: parseInt(formattedMonth), // Send as integer (1-12)
          cardExpYear: data.cardExpYear,
          cvv: data.cvv,
        },
        metadata: {
          orderType: 'subscription',
          userId: user.id,
          timestamp: new Date().toISOString(),
        },
      };

      // Build headers with required authentication
      const headers = {
        'X-API-Key': apiKey,
        'X-Merchant-Id': merchantId,
        'X-Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Add API Secret if provided
      if (secret) {
        headers['X-API-Secret'] = secret;
      }

      // Correct endpoint according to documentation: /api/v1/payments/deposits
      const endpoint = `${baseUrl}/payments/deposits`;

      console.log('Making deposit request:', {
        endpoint: endpoint,
        idempotencyKey: idempotencyKey,
        amount: data.amount,
        currency: reqBody.currency,
        merchantReference: reqBody.merchantReference,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reqBody),
      });

      console.log('Response status:', response.status);

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment provider error:', errorText.substring(0, 500));

        let errorMessage = `Payment failed with status ${response.status}`;

        // Check if response is HTML
        const isHtml =
          errorText.trim().startsWith('<!DOCTYPE') ||
          errorText.trim().startsWith('<html');

        if (isHtml) {
          const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
          errorMessage = titleMatch
            ? `Payment provider error: ${titleMatch[1]}`
            : `Payment provider returned HTML error page (status: ${response.status})`;
        } else {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch (e) {
            errorMessage =
              errorText.length > 200
                ? errorText.substring(0, 200) + '...'
                : errorText;
          }
        }

        // Special handling for 404
        if (response.status === 404) {
          throw new RpcException({
            message: `Payment endpoint not found (404). Please check the URL: ${endpoint}`,
            statusCode: HttpStatus.NOT_FOUND,
            details: {
              endpoint: endpoint,
              configuredBaseUrl: baseUrl,
            },
          });
        }

        throw new RpcException({
          message: `Payment failed: ${errorMessage}`,
          statusCode: response.status || HttpStatus.BAD_REQUEST,
        });
      }

      // Parse JSON response
      let res;
      try {
        res = await response.json();
        console.log('Payment response:', JSON.stringify(res, null, 2));
      } catch (jsonError) {
        const responseText = await response.text();
        console.error('Invalid JSON response:', responseText.substring(0, 500));

        throw new RpcException({
          message: 'Invalid response from payment provider',
          statusCode: HttpStatus.BAD_GATEWAY,
          details: {
            responsePreview: responseText.substring(0, 200),
          },
        });
      }

      // Return the response as per documentation
      // Response will contain: paymentId, status, paymentPageUrl, etc.
      return res;
    } catch (error) {
      console.error('Deposit error:', error);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: `Payment processing failed 'Internal server error'}`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
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
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (apiSecret) {
      headers['X-API-Secret'] = apiSecret;
    }

    return headers;
  }

  ///////////////////////////////////////////////////////////////
}
