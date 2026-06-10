export interface IWageringStats {
  id: string;
  userId: string;
  totalDeposits: number;
  totalWithdrawals: number;
  totalDebit: number;
  totalCredit: number;
  totalWagered: number;
  netProfit: number;
  rtp: number;
  todayWagered: number;
  weeklyWagered: number;
  monthlyWagered: number;
  bonusBetsCount: number;
  bonusWinnings: number;
  lastActivityDate: Date;
  lastResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBonusEligibility {
  eligible: boolean;
  currentWagered: number;
  remainingWagered: number;
  progress: number;
  wageringRequired: number;
}

export interface IWageringUpdateMetadata {
  debitAmount?: number;
  creditAmount?: number;
  isBonus?: boolean;
  bonusId?: string;
  gameId?: string;
  roundId?: string;
}

export type ResetType = 'daily' | 'weekly' | 'monthly' | 'full';

export interface IWageringStatsResponse {
  success: boolean;
  data?: IWageringStats;
  message?: string;
}
