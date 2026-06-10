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
}
