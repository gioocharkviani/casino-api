import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
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

  @Get('nuxgame/playerDetails')
  @UseGuards(NuxgameSignatureGuard)
  nuxgamePlayerDetails(
    @Query('token') token: string,
    @Query('userId') userId: string,
  ) {
    return this.walletService.nuxgamePlayerDetails(userId, token);
  }

  @Get('nuxgame/sessionCheck')
  @UseGuards(NuxgameSignatureGuard)
  nuxgameSessionCheck(
    @Query('token') token: string,
    @Query('userId') userId: string,
  ) {
    return this.walletService.nuxgameSessionCheck(userId, token);
  }

  @Get('nuxgame/getBalance')
  @UseGuards(NuxgameSignatureGuard)
  nuxgameGetBalance(
    @Query('token') token: string,
    @Query('userId') userId: string,
  ) {
    return this.walletService.nuxgameGetBalance(userId, token);
  }

  @Post('nuxgame/moveFunds')
  @HttpCode(200)
  @UseGuards(NuxgameSignatureGuard)
  async nuxgameMoveFunds(@Body() body: any) {
    const result = await this.walletService.nuxgameMoveFunds(body);
    if (result?.status && body?.direction === 'debit') {
      this.promoService.emitBetSettled(
        body.userId,
        Math.round(Number(body.amount) * 100),
        String(body.gameId),
      );
    }
    return result;
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
