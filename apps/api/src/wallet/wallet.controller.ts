import {
  Body,
  Controller,
  Get,
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
import { depositDto, withdrawalDto } from 'libs/common/dto/payment.dto';
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

  // WALLET DEPOSIT WITH WITHDRAWAL
  @Post('deposit')
  @UseGuards(AuthGuard)
  async deposit(@Req() req: Request, @Body() body: depositDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = { ...body, token };

    const result = await this.walletService.deposit(data);

    // fire-and-forget: auto-grant any deposit-triggered promotions
    if (result?.code === 200) {
      const userId = (req as any).userId as string;
      this.promoService.emitTrigger(userId, 'deposit', body.amount);
    }

    return result;
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
}
