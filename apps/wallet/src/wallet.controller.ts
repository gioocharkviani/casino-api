import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { WalletService } from './wallet.service';
import {
  CreditRequestDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern('WALLET_AUTH')
  walletAuth(data: WalletAuthDto) {
    return this.walletService.walletAuth(data);
  }

  @MessagePattern('WALLET_BALANCE')
  walletBallance(data: WalletBallanceDto) {
    return this.walletService.getWalletBallance(data);
  }

  @MessagePattern('WALLET_DEBIT')
  walletDebit(data: DebitRequestDto) {
    return this.walletService.walletDebit(data);
  }

  @MessagePattern('WALLET_CREDIT')
  walletCredit(data: CreditRequestDto) {
    return this.walletService.walletCredit(data);
  }

  @MessagePattern('WALLET_ROLLBACK')
  walletRollback(data: RollbackRequestDto) {
    return this.walletService.walletRollback(data);
  }

  @MessagePattern('DEBIT_CREDIT')
  creditAndDebit(data: RollbackRequestDto) {
    return this.walletService.creditAndDebit(data);
  }
}
