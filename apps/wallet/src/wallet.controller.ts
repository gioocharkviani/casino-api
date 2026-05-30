import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern } from '@nestjs/microservices';
import {
  DebitOrCreditRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  //Wallet auth service
  @MessagePattern('WALLET_AUTH')
  walletAuth(data: WalletAuthDto) {
    return this.walletService.walletAuth(data);
  }

  @MessagePattern('WALLET_BALANCE')
  walletBallance(data: WalletBallanceDto) {
    return this.walletService.getWalletBallance(data);
  }
  @MessagePattern('WALLET_DEBIT')
  walletDebit(data: DebitOrCreditRequestDto) {
    return this.walletService.walletDebit(data);
  }
  @MessagePattern('WALLET_CREDIT')
  walletCredit(data: DebitOrCreditRequestDto) {
    return this.walletService.walletCredit(data);
  }
}
