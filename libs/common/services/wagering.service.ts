import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWageringStats } from '../../database/entities/user-wagering.entity';
import { TransactionType } from '../enums/transactionTypes.enum';
import { IWageringStats } from '../interface/wagering.interface';
@Injectable()
export class WageringService {
  private readonly logger = new Logger(WageringService.name);

  constructor(
    @InjectRepository(UserWageringStats)
    private wageringRepository: Repository<UserWageringStats>,
  ) {}

  async updateWageringStats(
    userId: string,
    amount: number,
    transactionType: TransactionType,
    metadata?: any,
  ) {
    try {
      if (isNaN(amount) || amount === undefined || amount === null) {
        this.logger.warn(`Invalid amount: ${amount} for user ${userId}`);
        return null;
      }

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

        this.logger.log(`✅ Created new wagering stats for user ${userId}`);
      }

      // ========== რესეტების შემოწმება ==========
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];

      // დღიური რესეტი
      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        const lastReset = resetDate.toISOString().split('T')[0];
        if (lastReset !== todayDate) {
          stats.todayWagered = 0;
          stats.lastResetDate = today;
          this.logger.debug(`Daily reset for user ${userId}`);
        }
      } else {
        stats.lastResetDate = today;
      }

      // კვირის რესეტი
      const currentWeek = this.getWeekNumber(today);
      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        if (this.getWeekNumber(resetDate) !== currentWeek) {
          stats.weeklyWagered = 0;
          this.logger.debug(`Weekly reset for user ${userId}`);
        }
      }

      // თვის რესეტი
      if (stats.lastResetDate) {
        const resetDate =
          stats.lastResetDate instanceof Date
            ? stats.lastResetDate
            : new Date(stats.lastResetDate);
        if (resetDate.getMonth() !== today.getMonth()) {
          stats.monthlyWagered = 0;
          this.logger.debug(`Monthly reset for user ${userId}`);
        }
      }

      // ========== ტრანზაქციის ტიპის მიხედვით განახლება ==========
      switch (transactionType) {
        case TransactionType.CREDIT:
          stats.totalCredit += amount;
          stats.totalWagered += amount;
          stats.todayWagered += amount;
          stats.weeklyWagered += amount;
          stats.monthlyWagered += amount;
          break;

        case TransactionType.DEBIT:
          stats.totalDebit += amount;
          stats.totalWagered += amount;
          stats.todayWagered += amount;
          stats.weeklyWagered += amount;
          stats.monthlyWagered += amount;

          break;

        case TransactionType.DEBIT_AND_CREDIT:
          if (metadata) {
            if (metadata.debitAmount) {
              stats.totalDebit += metadata.debitAmount;
              stats.totalWagered += metadata.debitAmount;
              stats.todayWagered += metadata.debitAmount;
              stats.weeklyWagered += metadata.debitAmount;
              stats.monthlyWagered += metadata.debitAmount;
            }
            if (metadata.creditAmount) {
              stats.totalCredit += metadata.creditAmount;
            }
          }
          break;

        case TransactionType.DEPOSIT:
          stats.totalDeposits += amount;
          break;

        case TransactionType.WITHDRAWAL:
          stats.totalWithdrawals += amount;
          break;
      }

      // ========== მეტრიკების გამოთვლა ==========
      stats.netProfit = stats.totalCredit - stats.totalDebit;

      if (stats.totalDebit > 0) {
        stats.rtp = Number(
          ((stats.totalCredit / stats.totalDebit) * 100).toFixed(2),
        );
      }

      stats.lastActivityDate = new Date();

      this.logger.log(
        `📊 Updated wagering stats for user ${userId}: ` +
          `Wagered=${stats.totalWagered}, Net=${stats.netProfit}, RTP=${stats.rtp}%`,
      );
      await this.wageringRepository.save(stats);

      return stats;
    } catch (error) {
      this.logger.error(`Failed to update wagering stats for user `);
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
