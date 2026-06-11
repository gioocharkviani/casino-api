import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWageringStats } from '../../database/entities/user-wagering.entity';
import { TransactionType } from '../enums/transactionTypes.enum';
import { UserService } from 'apps/user/src/user.service';
@Injectable()
export class WageringService {
  private readonly logger = new Logger(WageringService.name);

  constructor(
    @InjectRepository(UserWageringStats)
    private wageringRepository: Repository<UserWageringStats>,
    ////////////////////////
    private readonly userService: UserService,
  ) {}

  async updateWageringStats(
    userId: string,
    amount: number,
    transactionType: TransactionType,
    metadata?: any,
  ) {
    try {
      const cleanAmount = Number(amount);

      let stats = await this.wageringRepository.findOne({
        where: { userId },
      });

      if (!stats) {
        stats = this.wageringRepository.create({
          userId,
          totalDeposits: 0,
          totalWithdrawals: 0,
          totalDebit: 0,
          totalCredit: 0,
          totalWagered: 0,
          netProfit: 0,
          rtp: 0,
          todayWagered: 0,
          weeklyWagered: 0,
          monthlyWagered: 0,
          bonusBetsCount: 0,
          bonusWinnings: 0,
          lastResetDate: new Date(),
          lastActivityDate: new Date(),
        });

        stats = await this.wageringRepository.save(stats);
      }

      stats.totalDebit = Number(stats.totalDebit) || 0;
      stats.totalCredit = Number(stats.totalCredit) || 0;
      stats.totalWagered = Number(stats.totalWagered) || 0;
      stats.todayWagered = Number(stats.todayWagered) || 0;
      stats.weeklyWagered = Number(stats.weeklyWagered) || 0;
      stats.monthlyWagered = Number(stats.monthlyWagered) || 0;
      stats.totalDeposits = Number(stats.totalDeposits) || 0;
      stats.totalWithdrawals = Number(stats.totalWithdrawals) || 0;
      stats.bonusWinnings = Number(stats.bonusWinnings) || 0;
      stats.netProfit = Number(stats.netProfit) || 0;

      // ========== რეზეტების შემოწმება ==========
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];

      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        const lastReset = resetDate.toISOString().split('T')[0];
        if (lastReset !== todayDate) {
          stats.todayWagered = 0;
          stats.lastResetDate = today;
        }
      } else {
        stats.lastResetDate = today;
      }

      const currentWeek = this.getWeekNumber(today);
      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        if (this.getWeekNumber(resetDate) !== currentWeek) {
          stats.weeklyWagered = 0;
        }
      }

      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        if (resetDate.getMonth() !== today.getMonth()) {
          stats.monthlyWagered = 0;
        }
      }

      // ========== ტრანზაქციის ტიპი ==========
      switch (transactionType) {
        case TransactionType.DEBIT:
          stats.totalDebit += cleanAmount;
          stats.totalWagered += cleanAmount;
          stats.todayWagered += cleanAmount;
          stats.weeklyWagered += cleanAmount;
          stats.monthlyWagered += cleanAmount;
          break;

        case TransactionType.CREDIT:
          stats.totalCredit += cleanAmount;
          stats.totalWagered += cleanAmount;
          stats.todayWagered += cleanAmount;
          stats.weeklyWagered += cleanAmount;
          stats.monthlyWagered += cleanAmount;
          break;

        case TransactionType.ROLLBACK:
          break;

        case TransactionType.DEBIT_AND_CREDIT:
          if (metadata) {
            if (metadata.debitAmount) {
              const debitAmt = Number(metadata.debitAmount);
              stats.totalDebit += debitAmt;
              stats.totalWagered += debitAmt;
              stats.todayWagered += debitAmt;
              stats.weeklyWagered += debitAmt;
              stats.monthlyWagered += debitAmt;
            }
            if (metadata.creditAmount) {
              stats.totalCredit += Number(metadata.creditAmount);
            }
          }
          break;

        case TransactionType.DEPOSIT:
          stats.totalDeposits += cleanAmount;
          break;

        case TransactionType.WITHDRAWAL:
          stats.totalWithdrawals += cleanAmount;
          break;
      }

      stats.netProfit = stats.totalCredit - stats.totalDebit;

      if (stats.totalDebit > 0) {
        stats.rtp = Number(
          ((stats.totalCredit / stats.totalDebit) * 100).toFixed(2),
        );
      }

      stats.lastActivityDate = new Date();

      await this.wageringRepository.save(stats);

      //CHANGE USER XP
      await this.userService.changeUserLevel({ playerId: userId });

      return stats;
    } catch (error) {
      this.logger.error(`Failed: `);
      throw error;
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  }
}
