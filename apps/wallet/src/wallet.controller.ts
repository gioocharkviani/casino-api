import { Controller, Inject } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import {
  CreditRequestDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { WageringService } from 'libs/common/services/wagering.service';
import { TransactionType } from 'libs/common';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly wagerService: WageringService,
    @Inject('USER_M_SERVICE') private readonly userClient: ClientProxy,
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
  async walletDebit(data: DebitRequestDto) {
    const res = this.walletService.walletDebit(data);
    await this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.DEBIT,
    );
    this.userClient.emit('USER_XP', { userId: data.playerId });
    return res;
  }
  @MessagePattern('WALLET_CREDIT')
  async walletCredit(data: CreditRequestDto) {
    const res = this.walletService.walletCredit(data);
    await this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.CREDIT,
    );
    this.userClient.emit('USER_XP', { userId: data.playerId });
    return res;
  }
  @MessagePattern('WALLET_ROLLBACK')
  async walletRollback(data: RollbackRequestDto) {
    const res = await this.walletService.walletRollback(data);
    await this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.ROLLBACK,
    );
    this.userClient.emit('USER_XP', { userId: data.playerId });
    return res;
  }
  @MessagePattern('DEBIT_CREDIT')
  async creditAndDebit(data: RollbackRequestDto) {
    const res = this.walletService.creditAndDebit(data);
    await this.wagerService.updateWageringStats(
      data.playerId,
      data.amount,
      TransactionType.DEBIT_AND_CREDIT,
      {
        debitAmount: data.debitAmount,
        creditAmount: data.creditAmount,
      },
    );
    this.userClient.emit('USER_XP', { userId: data.playerId });
    return res;
  }
}
