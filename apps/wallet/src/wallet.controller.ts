import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WalletService } from './wallet.service';
import {
  CreditRequestDto,
  DebitRequestDto,
  RollbackRequestDto,
  WalletAuthDto,
  WalletBallanceDto,
} from 'libs/common/dto/wallet.dto';
import { PaymentService } from './payment/payment.service';
import { depositDto, withdrawalDto } from 'libs/common/dto/payment.dto';
import { transactionService } from './transactions/transaction.service';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly transactionService: transactionService,
  ) {}

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

  //GET ALL USER TRANSACTION
  @MessagePattern('GET_USER_TRANSACTIONS')
  getTransaction(token: string) {
    return this.transactionService.getUserTransactions(token);
  }

  //WALLET DEPIT AND withdrawal
  @MessagePattern('WALLET_DEPOSIT')
  deposit(data: depositDto) {
    return this.paymentService.deposit(data);
  }
  @MessagePattern('WALLET_WITHDRAWAL')
  withdrawal(data: withdrawalDto) {
    return this.paymentService.withdrawal(data);
  }

  // ADMIN: get transactions by userId
  @MessagePattern('ADMIN_USER_TRANSACTIONS')
  adminUserTransactions(
    @Payload() data: { userId: string; limit?: number },
  ) {
    return this.transactionService.getTransactionsByUserId(
      data.userId,
      data.limit,
    );
  }

  // ADMIN: manual balance adjustment
  @MessagePattern('ADMIN_ADJUST_BALANCE')
  adminAdjustBalance(
    @Payload()
    data: {
      userId: string;
      amount: number;
      type: 'credit' | 'debit';
      reason: string;
      adminId: string;
    },
  ) {
    return this.walletService.adminAdjustBalance(data);
  }
}
