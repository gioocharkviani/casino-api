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
import { NegativeValueGuard } from 'libs/guards/negativeValue.guard';

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
    return this.walletService.balance(body);
  }

  @Post('debit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard, NegativeValueGuard)
  async debit(@Body() body: DebitRequestDto) {
    return this.walletService.debit(body);
  }

  @Post('credit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard, NegativeValueGuard)
  async credit(@Body() body: CreditRequestDto) {
    return this.walletService.credit(body);
  }

  @Post('rollback')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard, NegativeValueGuard)
  async rollback(@Body() body: RollbackRequestDto) {
    return this.walletService.rollback(body);
  }

  @Post('debitAndCredit')
  @HttpCode(200)
  @UseGuards(RevolverSignatureGuard, NegativeValueGuard)
  async debitAndCredit(@Body() body: DebitAndCreditDto) {
    return this.walletService.debitAndCredit(body);
  }
}
