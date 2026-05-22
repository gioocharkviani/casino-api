import { Body, Controller, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}
  //WALLET AUTH
  @Post('auth')
  walletAuth(@Body() body: WalletAuthDto) {
    return this.walletService.walletAuth(body);
  }
  //WALLET AUTH
}
