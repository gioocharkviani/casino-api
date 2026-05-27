import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('auth')
  @HttpCode(200)
  walletAuth(@Body() body: WalletAuthDto) {
    return this.walletService.walletAuth(body);
  }

  @Post('balance')
  @HttpCode(200)
  async balance(@Body() body: any) {
    return this.walletService.balance(body);
  }

  @Post('debit')
  @HttpCode(200)
  async debit(@Body() body: any) {
    return this.walletService.debit(body);
  }

  @Post('credit')
  @HttpCode(200)
  async credit(@Body() body: any) {
    return this.walletService.credit(body);
  }

  @Post('rollback')
  @HttpCode(200)
  async rollback(@Body() body: any) {
    return this.walletService.rollback(body);
  }

  @Post('debitAndCredit')
  @HttpCode(200)
  async debitAndCredit(@Body() body: any) {
    return this.walletService.debitAndCredit(body);
  }
}
