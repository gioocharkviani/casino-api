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

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

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
    return await this.walletService.debit(body);
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

  //WALLET DEPOSIT WITHDROWALL
  @Post('deposit')
  async deposit(@Req() req: Request, @Body() body: depositDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = {
      ...body,
      token: token,
    };
    return await this.walletService.deposit(data);
  }

  @Post('withdrawal')
  async withdrawal(@Req() req: Request, @Body() body: withdrawalDto) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    const data = {
      ...body,
      token: token,
    };
    return await this.walletService.withdrawal(data);
  }
  //END WALLET DEPOSIT WITHDROWALL

  //GET USER TRANSACTION
  @Get('user-transactions')
  @UseGuards(AuthGuard)
  async userTansactions(@Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    return await this.walletService.userTansactions(token);
  }
}
