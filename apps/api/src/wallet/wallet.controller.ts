import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import {
  CreditRequestDto,
  DebitAndCreditDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { RevolverSignatureGuard } from 'libs/guards/revolver-signature.guard';
import { NuxgameSignatureGuard } from 'libs/guards/nuxgame-signature.guard';
import {
  depositDto,
  withdrawalDto,
  PayInExtraWebhookDto,
} from 'libs/common/dto/payment.dto';
import { AuthGuard } from 'libs/guards/auth.guard';
import type { Request } from 'express';
import { PromotionsGatewayService } from '../promotions/promotions.service';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly promoService: PromotionsGatewayService,
  ) {}

  @Post('auth')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  walletAuth(@Body() body: WalletAuthDto) {
    const res = this.walletService.walletAuth(body);
    return res;
  }

  @Post('balance')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async balance(@Body() body: WalletBallanceDto) {
    return await this.walletService.balance(body);
  }

  @Post('debit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debit(@Body() body: DebitRequestDto) {
    const result = await this.walletService.debit(body);
    // fire-and-forget: update wagering progress for active bonuses
    if (result?.code === 200) {
      this.promoService.emitBetSettled(body.playerId, body.amount, body.gameId);
    }
    return result;
  }

  @Post('credit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async credit(@Body() body: CreditRequestDto) {
    return await this.walletService.credit(body);
  }

  @Post('rollback')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async rollback(@Body() body: RollbackRequestDto) {
    return await this.walletService.rollback(body);
  }

  @Post('debitAndCredit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debitAndCredit(@Body() body: DebitAndCreditDto) {
    return await this.walletService.debitAndCredit(body);
  }

  // NUXGAME WALLET CALLBACKS
  // Separate route namespace + guard from Revolver's since NuxGame's
  // signature scheme is unconfirmed (TODO once real docs/keys are in).
  // Business logic is shared via WalletService (provider-agnostic).
  @Post('nuxgame/auth')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  nuxgameWalletAuth(@Body() body: WalletAuthDto) {
    return this.walletService.walletAuth(body);
  }

  @Post('nuxgame/balance')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameBalance(@Body() body: WalletBallanceDto) {
    return await this.walletService.balance(body);
  }

  @Post('nuxgame/debit')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameDebit(@Body() body: DebitRequestDto) {
    const result = await this.walletService.debit(body);
    if (result?.code === 200) {
      this.promoService.emitBetSettled(body.playerId, body.amount, body.gameId);
    }
    return result;
  }

  @Post('nuxgame/credit')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameCredit(@Body() body: CreditRequestDto) {
    return await this.walletService.credit(body);
  }

  @Post('nuxgame/rollback')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameRollback(@Body() body: RollbackRequestDto) {
    return await this.walletService.rollback(body);
  }

  @Post('nuxgame/debitAndCredit')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameDebitAndCredit(@Body() body: DebitAndCreditDto) {
    return await this.walletService.debitAndCredit(body);
  }

  // WALLET DEPOSIT WITH WITHDRAWAL
  @Post('deposit')
  @UseGuards(AuthGuard)
  async deposit(@Req() req: Request, @Body() body: depositDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = { ...body, token };

    return await this.walletService.deposit(data);
  }

  @Post('withdrawal')
  async withdrawal(@Req() req: Request, @Body() body: withdrawalDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = { ...body, token };
    return await this.walletService.withdrawal(data);
  }

  // GET USER TRANSACTION
  @Get('user-transactions')
  @UseGuards(AuthGuard)
  async userTansactions(@Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    return await this.walletService.userTansactions(token);
  }

  // PAYINEXTRA WEBHOOK CALLBACK (called by PayInExtra when payment status changes)
  @Post('webhook/payinextra')
  @HttpCode(200)
  async paymentWebhook(
    @Body() body: PayInExtraWebhookDto,
    @Headers('x-secret-key') secretKey: string,
  ) {
    const result = await this.walletService.handlePaymentWebhook({
      ...body,
      webhookSecret: secretKey,
    });
    // fire promo trigger only after deposit is confirmed by payment provider
    if (result?.triggerData) {
      const { userId, amount, eventType } = result.triggerData;
      this.promoService.emitTrigger(userId, eventType, amount);
    }
    return result;
  }
}
