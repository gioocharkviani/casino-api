import { Controller, Get, Inject } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern } from '@nestjs/microservices';
import { WalletAuthDto } from 'libs/common/dto/wallet.dto';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  //Wallet auth service
  @MessagePattern('WALLET_AUTH')
  walletAuth(data: WalletAuthDto) {
    return this.walletService.walletAuth(data);
  }
}
