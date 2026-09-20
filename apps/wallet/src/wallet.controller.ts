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
import {
  depositDto,
  withdrawalDto,
  PayInExtraWebhookDto,
} from 'libs/common/dto/payment.dto';
import { transactionService } from './transactions/transaction.service';
import { AnalyticsService } from './analytics/analytics.service';

@Controller()
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    private readonly transactionService: transactionService,
    private readonly analyticsService: AnalyticsService,
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

  // NUXGAME CALLBACKS
  @MessagePattern('NUXGAME_PLAYER_DETAILS')
  nuxgamePlayerDetails(@Payload() data: { userId: string; token: string }) {
    return this.walletService.nuxgamePlayerDetails(data.userId, data.token);
  }

  @MessagePattern('NUXGAME_SESSION_CHECK')
  nuxgameSessionCheck(@Payload() data: { userId: string; token: string }) {
    return this.walletService.nuxgameSessionCheck(data.userId, data.token);
  }

  @MessagePattern('NUXGAME_GET_BALANCE')
  nuxgameGetBalance(@Payload() data: { userId: string; token: string }) {
    return this.walletService.nuxgameGetBalance(data.userId, data.token);
  }

  @MessagePattern('NUXGAME_MOVE_FUNDS')
  nuxgameMoveFunds(@Payload() data: any) {
    return this.walletService.nuxgameMoveFunds(data);
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

  @MessagePattern('PAYMENT_WEBHOOK')
  handlePaymentWebhook(@Payload() data: PayInExtraWebhookDto & { webhookSecret: string }) {
    return this.paymentService.handleWebhook(data);
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

  // ADMIN: all transactions with pagination and filters
  @MessagePattern('ADMIN_ALL_TRANSACTIONS')
  adminAllTransactions(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      userId?: string;
      provider?: string;
      gameId?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: 'createdAt' | 'amount';
      sortDir?: 'ASC' | 'DESC';
    },
  ) {
    return this.transactionService.adminGetAllTransactions(data);
  }

  // ADMIN: where a user spends the most (grouped by game / provider)
  @MessagePattern('ADMIN_USER_TOP_SPEND')
  adminUserTopSpend(
    @Payload() data: { userId: string; dateFrom?: string; dateTo?: string },
  ) {
    return this.transactionService.adminGetUserTopSpend(
      data.userId,
      data.dateFrom,
      data.dateTo,
    );
  }

  // ADMIN: platform analytics
  @MessagePattern('ADMIN_ANALYTICS')
  adminAnalytics() {
    return this.analyticsService.getPlatformAnalytics();
  }

  // ADMIN: per-user analytics
  @MessagePattern('ADMIN_USER_ANALYTICS')
  adminUserAnalytics(@Payload() userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  // ADMIN: game performance report
  @MessagePattern('ADMIN_GAME_REPORT')
  adminGameReport(@Payload() data: { dateFrom?: string; dateTo?: string }) {
    return this.analyticsService.getGameReport(data?.dateFrom, data?.dateTo);
  }

  // ADMIN: approve pending withdrawal
  @MessagePattern('ADMIN_APPROVE_WITHDRAWAL')
  adminApproveWithdrawal(@Payload() txId: string) {
    return this.paymentService.adminApproveWithdrawal(txId);
  }

  // ADMIN: reject pending withdrawal (refund balance)
  @MessagePattern('ADMIN_REJECT_WITHDRAWAL')
  adminRejectWithdrawal(@Payload() data: { txId: string; reason: string }) {
    return this.paymentService.adminRejectWithdrawal(data.txId, data.reason);
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
