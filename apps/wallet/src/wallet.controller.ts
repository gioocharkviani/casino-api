import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  //Wallet auth service
  @MessagePattern('WALLET_AUTH')
  walletAuth(data: any) {
    return this.walletService.walletAuth(data);
  }
}
