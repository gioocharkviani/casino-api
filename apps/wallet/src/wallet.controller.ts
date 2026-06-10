import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern } from '@nestjs/microservices';
import {
  CreditRequestDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { WageringService } from 'libs/common/services/wagering.service';
import { TransactionType } from 'libs/common';
import { metadata } from 'reflect-metadata/no-conflict';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly wagerService: WageringService,
  ) {}

  //Wallet auth service
  @MessagePattern('WALLET_AUTH')
  walletAuth(data: WalletAuthDto) {
    const res = this.walletService.walletAuth(data);
    return res;
  }

  @MessagePattern('WALLET_BALANCE')
  walletBallance(data: WalletBallanceDto) {
    return this.walletService.getWalletBallance(data);
  }
  @MessagePattern('WALLET_DEBIT')
  walletDebit(data: DebitRequestDto) {
    const res = this.walletService.walletDebit(data);
    this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.DEBIT,
    );
    return res;
  }
  @MessagePattern('WALLET_CREDIT')
  walletCredit(data: CreditRequestDto) {
    const res = this.walletService.walletCredit(data);
    this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.CREDIT,
    );
    return res;
  }
  @MessagePattern('WALLET_ROLLBACK')
  walletRollback(data: RollbackRequestDto) {
    return this.walletService.walletRollback(data);
  }
  @MessagePattern('DEBIT_CREDIT')
  creditAndDebit(data: RollbackRequestDto) {
    const res = this.walletService.creditAndDebit(data);
    this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.DEBIT_AND_CREDIT,
      {
        debitAmount: data.debitAmount,
        creditAmount: data.creditAmount,
      },
    );
    return res;
  }
}
