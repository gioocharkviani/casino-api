import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletAuthDto, WalletBallanceDto } from 'libs/common/dto/wallet.dto';
import { RevolverSignatureGuard } from 'libs/guards/revolver-signature.guard';
import { AuthGuard } from 'libs/guards/auth.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('auth')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  walletAuth(@Body() body: WalletAuthDto) {
    return this.walletService.walletAuth(body);
  }

  @Post('balance')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async balance(@Body() body: WalletBallanceDto) {
    console.log(body);
    return this.walletService.balance(body);
  }

  @Post('debit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debit(@Body() body: any) {
    return this.walletService.debit(body);
  }

  @Post('credit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async credit(@Body() body: any) {
    return this.walletService.credit(body);
  }

  @Post('rollback')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async rollback(@Body() body: any) {
    return this.walletService.rollback(body);
  }

  @Post('debitAndCredit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debitAndCredit(@Body() body: any) {
    return this.walletService.debitAndCredit(body);
  }
}
