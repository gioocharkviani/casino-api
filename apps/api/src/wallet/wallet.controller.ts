import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
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
    console.log('debit balance', body);
    return this.walletService.balance(body);
  }

  @Post('debit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debit(@Body() body: DebitRequestDto) {
    console.log('debit loging', body);
    return this.walletService.debit(body);
  }

  @Post('credit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async credit(@Body() body: CreditRequestDto) {
    console.log('debit credit', body);
    return this.walletService.credit(body);
  }

  @Post('rollback')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async rollback(@Body() body: RollbackRequestDto) {
    console.log('debit rollback', body);
    return this.walletService.rollback(body);
  }

  @Post('debitAndCredit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard)
  async debitAndCredit(@Body() body: DebitAndCreditDto) {
    console.log('debit and credit ', body);
    return this.walletService.debitAndCredit(body);
  }
}
