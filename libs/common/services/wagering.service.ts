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
      }

      // დღიური რეზეტის შემოწმება
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];

      if (stats.lastResetDate) {
        const lastReset = stats.lastResetDate.toISOString().split('T')[0];
        if (lastReset !== todayDate) {
          stats.todayWagered = 0;
          stats.lastResetDate = today;
        }
      } else {
        stats.lastResetDate = today;
      }

      // კვირის რეზეტი
      const currentWeek = this.getWeekNumber(today);
      if (
        stats.lastResetDate &&
        this.getWeekNumber(stats.lastResetDate) !== currentWeek
      ) {
        stats.weeklyWagered = 0;
      }

      // თვის რეზეტი
      if (
        stats.lastResetDate &&
        stats.lastResetDate.getMonth() !== today.getMonth()
      ) {
        stats.monthlyWagered = 0;
      }

      // ტრანზაქციის ტიპის მიხედვით განახლება
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

      // წმინდა მოგების გამოთვლა
      stats.netProfit = stats.totalCredit - stats.totalDebit;

      // RTP-ს გამოთვლა
      if (stats.totalDebit > 0) {
        stats.rtp = (stats.totalCredit / stats.totalDebit) * 100;
      }

      stats.lastActivityDate = new Date();

      await this.wageringRepository.save(stats);

      this.logger.log(
        `Updated wagering stats for user ${userId}: Wagered=${stats.totalWagered}, Net=${stats.netProfit}`,
      );

      return stats;
    } catch (error) {
      this.logger.error(`Failed to update wagering stats`);
      throw error;
    }
  }

  async getUserWageringStats(userId: string): Promise<UserWageringStats> {
    const stats = await this.wageringRepository.findOne({
      where: { userId },
      relations: { user: true },
    });

    if (!stats) {
      return this.wageringRepository.create({
        userId,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalDebit: 0,
        totalCredit: 0,
        totalWagered: 0,
        netProfit: 0,
        rtp: 0,
      });
    }

    return stats;
  }

  async getBonusEligibility(
    userId: string,
    bonusRequirement: number,
  ): Promise<{
    eligible: boolean;
    currentWagered: number;
    remainingWagered: number;
    progress: number;
  }> {
    const stats = await this.getUserWageringStats(userId);
    const currentWagered = stats.totalWagered ?? 0;
    const remaining = Math.max(0, bonusRequirement - currentWagered);
    const progress =
      bonusRequirement > 0 ? (currentWagered / bonusRequirement) * 100 : 100;

    return {
      eligible: currentWagered >= bonusRequirement,
      currentWagered,
      remainingWagered: remaining,
      progress,
    };
  }

  async resetUserWagering(
    userId: string,
    type: 'daily' | 'weekly' | 'monthly' | 'full',
  ) {
    const stats = await this.wageringRepository.findOne({ where: { userId } });

    if (!stats) return;

    switch (type) {
      case 'daily':
        stats.todayWagered = 0;
        break;
      case 'weekly':
        stats.weeklyWagered = 0;
        break;
      case 'monthly':
        stats.monthlyWagered = 0;
        break;
      case 'full':
        stats.totalWagered = 0;
        stats.totalDebit = 0;
        stats.totalCredit = 0;
        stats.netProfit = 0;
        stats.rtp = 0;
        break;
    }

    await this.wageringRepository.save(stats);
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
