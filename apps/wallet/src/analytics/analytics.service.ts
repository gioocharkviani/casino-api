import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';
import { GameSession, Game } from 'libs/database/entities/game.entity';
import { UserWageringStats } from 'libs/database/entities/user-wagering.entity';
import { UserPromotionEntity } from 'libs/database/entities/promotions.entity';
import { TransactionStatusEnum, TransactionType } from 'libs/common';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    @InjectRepository(UserWageringStats)
    private readonly wagerRepo: Repository<UserWageringStats>,
    @InjectRepository(UserPromotionEntity)
    private readonly userPromoRepo: Repository<UserPromotionEntity>,
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  // ── PLATFORM ANALYTICS ───────────────────────────────────────────────────

  async getPlatformAnalytics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const succeeded = [TransactionStatusEnum.SUCCEEDED, TransactionStatusEnum.APPROVED];

      const [
        depositStats,
        withdrawalStats,
        pendingWithdrawals,
        bonusStats,
        dailyFinancial,
        dailySessions,
        dailyActiveUsers,
        topGameIds,
        typeBreakdown,
        activeSessions,
        totalSessions,
      ] = await Promise.all([
        this.txRepo.createQueryBuilder('tx')
          .select('COALESCE(SUM(CAST(tx.amount AS SIGNED)), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .addSelect('COALESCE(AVG(CAST(tx.amount AS SIGNED)), 0)', 'avg')
          .where('tx.type = :type', { type: TransactionType.DEPOSIT })
          .andWhere('tx.status IN (:...statuses)', { statuses: succeeded })
          .getRawOne(),

        this.txRepo.createQueryBuilder('tx')
          .select('COALESCE(SUM(CAST(tx.amount AS SIGNED)), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where('tx.type = :type', { type: TransactionType.WITHDRAWAL })
          .andWhere('tx.status IN (:...statuses)', { statuses: succeeded })
          .getRawOne(),

        this.txRepo.createQueryBuilder('tx')
          .select('COALESCE(SUM(CAST(tx.amount AS SIGNED)), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where('tx.type = :type', { type: TransactionType.WITHDRAWAL })
          .andWhere('tx.status = :status', { status: TransactionStatusEnum.PENDING })
          .getRawOne(),

        this.txRepo.createQueryBuilder('tx')
          .select('COALESCE(SUM(CAST(tx.amount AS SIGNED)), 0)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where('tx.type = :type', { type: TransactionType.BONUS })
          .getRawOne(),

        this.txRepo.createQueryBuilder('tx')
          .select('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'date')
          .addSelect(
            "SUM(CASE WHEN tx.type = 'deposit' AND tx.status IN ('succeeded','approved') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'deposits',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type = 'withdrawal' AND tx.status IN ('succeeded','approved') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'withdrawals',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type IN ('debit','debit&credit') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'wagered',
          )
          .addSelect('COUNT(DISTINCT tx.user_id)', 'activeUsers')
          .where('tx.createdAt >= :from', { from: thirtyDaysAgo })
          .groupBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')')
          .orderBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'ASC')
          .getRawMany(),

        this.sessionRepo.createQueryBuilder('gs')
          .select('DATE_FORMAT(gs.createdAt, \'%Y-%m-%d\')', 'date')
          .addSelect('COUNT(*)', 'count')
          .addSelect('COUNT(DISTINCT gs.playerId)', 'uniquePlayers')
          .where('gs.createdAt >= :from', { from: thirtyDaysAgo })
          .groupBy('DATE_FORMAT(gs.createdAt, \'%Y-%m-%d\')')
          .orderBy('DATE_FORMAT(gs.createdAt, \'%Y-%m-%d\')', 'ASC')
          .getRawMany(),

        this.txRepo.createQueryBuilder('tx')
          .select('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'date')
          .addSelect('COUNT(DISTINCT tx.user_id)', 'count')
          .where('tx.createdAt >= :from', { from: thirtyDaysAgo })
          .groupBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')')
          .orderBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'ASC')
          .getRawMany(),

        // Top games by wagered - get IDs first, then join names separately
        this.txRepo.createQueryBuilder('tx')
          .select('tx.game_id', 'gameId')
          .addSelect(
            "SUM(CASE WHEN tx.type IN ('debit','debit&credit') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'wagered',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type = 'credit' THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'won',
          )
          .addSelect('COUNT(DISTINCT tx.user_id)', 'uniquePlayers')
          .where('tx.game_id IS NOT NULL')
          .groupBy('tx.game_id')
          .orderBy('wagered', 'DESC')
          .limit(10)
          .getRawMany(),

        this.txRepo.createQueryBuilder('tx')
          .select('tx.type', 'type')
          .addSelect('COUNT(*)', 'count')
          .addSelect('COALESCE(SUM(CAST(tx.amount AS SIGNED)), 0)', 'totalAmount')
          .groupBy('tx.type')
          .getRawMany(),

        this.sessionRepo.createQueryBuilder('gs')
          .where('gs.isActive = :a', { a: true })
          .getCount(),

        this.sessionRepo.count(),
      ]);

      // Enrich top games with names
      const gameIds = topGameIds.map((g: any) => g.gameId).filter(Boolean);
      const games = gameIds.length
        ? await this.gameRepo.createQueryBuilder('g')
            .select(['g.gameUUID', 'g.gameName', 'g.thumbnail'])
            .where('g.gameUUID IN (:...ids)', { ids: gameIds })
            .getMany()
        : [];
      const gameMap = new Map(games.map((g) => [g.gameUUID, g]));

      const ggr = Number(depositStats.total) - Number(withdrawalStats.total);

      return {
        code: 200,
        data: {
          financial: {
            deposits:           { total: Number(depositStats.total), count: Number(depositStats.count), average: Math.round(Number(depositStats.avg)) },
            withdrawals:        { total: Number(withdrawalStats.total), count: Number(withdrawalStats.count) },
            pendingWithdrawals: { total: Number(pendingWithdrawals.total), count: Number(pendingWithdrawals.count) },
            bonusPayouts:       { total: Number(bonusStats.total), count: Number(bonusStats.count) },
            ggr,
            netRevenue: ggr,
          },
          games: {
            totalSessions,
            activeSessions,
            topGames: topGameIds.map((g: any) => {
              const info = gameMap.get(g.gameId);
              return {
                gameId:        g.gameId as string,
                gameName:      info?.gameName ?? g.gameId,
                thumbnail:     info?.thumbnail ?? null,
                wagered:       Number(g.wagered),
                won:           Number(g.won),
                ggr:           Number(g.wagered) - Number(g.won),
                uniquePlayers: Number(g.uniquePlayers),
              };
            }),
          },
          timeSeries: {
            dailyFinancial: dailyFinancial.map((d: any) => ({
              date:        String(d.date),
              deposits:    Number(d.deposits),
              withdrawals: Number(d.withdrawals),
              wagered:     Number(d.wagered),
              ggr:         Number(d.deposits) - Number(d.withdrawals),
              activeUsers: Number(d.activeUsers),
            })),
            dailySessions: dailySessions.map((d: any) => ({
              date:          String(d.date),
              sessions:      Number(d.count),
              uniquePlayers: Number(d.uniquePlayers),
            })),
            dailyActiveUsers: dailyActiveUsers.map((d: any) => ({
              date:  String(d.date),
              count: Number(d.count),
            })),
          },
          typeBreakdown: typeBreakdown.map((t: any) => ({
            type:        t.type as string,
            count:       Number(t.count),
            totalAmount: Number(t.totalAmount),
          })),
        },
      };
    } catch (err: any) {
      this.logger.error('getPlatformAnalytics failed:', err?.message, err?.stack);
      return { code: 500, data: null, message: err?.message ?? 'Analytics error' };
    }
  }

  // ── USER ANALYTICS ───────────────────────────────────────────────────────

  async getUserAnalytics(userId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        wagerStats,
        topGameIds,
        dailyActivity,
        depositHistory,
        withdrawalHistory,
        sessionStats,
        activePromos,
        firstDeposit,
        lastActivity,
      ] = await Promise.all([
        this.wagerRepo.findOne({ where: { userId } }),

        this.txRepo.createQueryBuilder('tx')
          .select('tx.game_id', 'gameId')
          .addSelect(
            "SUM(CASE WHEN tx.type IN ('debit','debit&credit') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'wagered',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type = 'credit' THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'won',
          )
          .addSelect('COUNT(*)', 'txCount')
          .where('tx.userId = :userId', { userId })
          .andWhere('tx.game_id IS NOT NULL')
          .groupBy('tx.game_id')
          .orderBy('wagered', 'DESC')
          .limit(10)
          .getRawMany(),

        this.txRepo.createQueryBuilder('tx')
          .select('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'date')
          .addSelect(
            "SUM(CASE WHEN tx.type IN ('debit','debit&credit') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'wagered',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type = 'credit' THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'won',
          )
          .addSelect(
            "SUM(CASE WHEN tx.type = 'deposit' AND tx.status IN ('succeeded','approved') THEN CAST(tx.amount AS SIGNED) ELSE 0 END)",
            'deposited',
          )
          .where('tx.userId = :userId', { userId })
          .andWhere('tx.createdAt >= :from', { from: thirtyDaysAgo })
          .groupBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')')
          .orderBy('DATE_FORMAT(tx.created_at, \'%Y-%m-%d\')', 'ASC')
          .getRawMany(),

        this.txRepo.find({
          where: { userId, type: TransactionType.DEPOSIT },
          order: { createdAt: 'DESC' },
          take: 20,
          select: { id: true, amount: true, status: true, createdAt: true },
        }),

        this.txRepo.find({
          where: { userId, type: TransactionType.WITHDRAWAL },
          order: { createdAt: 'DESC' },
          take: 20,
          select: { id: true, amount: true, status: true, createdAt: true },
        }),

        this.sessionRepo.createQueryBuilder('gs')
          .select('COUNT(*)', 'totalSessions')
          .addSelect('SUM(CASE WHEN gs.isActive = 1 THEN 1 ELSE 0 END)', 'activeSessions')
          .where('gs.playerId = :userId', { userId })
          .getRawOne(),

        this.userPromoRepo.count({ where: { userId, status: 'active' as any } }),

        this.txRepo.findOne({
          where: { userId, type: TransactionType.DEPOSIT },
          order: { createdAt: 'ASC' },
          select: { createdAt: true, amount: true },
        }),

        this.txRepo.findOne({
          where: { userId },
          order: { createdAt: 'DESC' },
          select: { createdAt: true },
        }),
      ]);

      // Enrich top games with names
      const gameIds = topGameIds.map((g: any) => g.gameId).filter(Boolean);
      const games = gameIds.length
        ? await this.gameRepo.createQueryBuilder('g')
            .select(['g.gameUUID', 'g.gameName', 'g.thumbnail'])
            .where('g.gameUUID IN (:...ids)', { ids: gameIds })
            .getMany()
        : [];
      const gameMap = new Map(games.map((g) => [g.gameUUID, g]));

      const totalWagered     = Number(wagerStats?.totalWagered    ?? 0);
      const totalDeposits    = Number(wagerStats?.totalDeposits   ?? 0);
      const totalWithdrawals = Number(wagerStats?.totalWithdrawals ?? 0);
      const totalDebit       = Number(wagerStats?.totalDebit      ?? 0);
      const totalCredit      = Number(wagerStats?.totalCredit     ?? 0);
      const ggr              = totalDebit - totalCredit;

      return {
        code: 200,
        data: {
          summary: {
            totalDeposits,
            totalWithdrawals,
            netDeposit:       totalDeposits - totalWithdrawals,
            totalWagered,
            totalWon:         totalCredit,
            ggr,
            netProfit:        Number(wagerStats?.netProfit      ?? 0),
            rtp:              Number(wagerStats?.rtp            ?? 0),
            bonusBetsCount:   Number(wagerStats?.bonusBetsCount ?? 0),
            bonusWinnings:    Number(wagerStats?.bonusWinnings  ?? 0),
            depositCount:     depositHistory.length,
            activePromotions: activePromos,
            firstDepositAt:   firstDeposit?.createdAt ?? null,
            lastActivityAt:   lastActivity?.createdAt ?? null,
          },
          activity: {
            todayWagered:    Number(wagerStats?.todayWagered   ?? 0),
            weeklyWagered:   Number(wagerStats?.weeklyWagered  ?? 0),
            monthlyWagered:  Number(wagerStats?.monthlyWagered ?? 0),
            lastActivityDate: wagerStats?.lastActivityDate ?? null,
          },
          games: {
            totalSessions:  Number(sessionStats?.totalSessions  ?? 0),
            activeSessions: Number(sessionStats?.activeSessions ?? 0),
            totalGameTime:  0,
            topGames: topGameIds.map((g: any) => {
              const info = gameMap.get(g.gameId);
              return {
                gameId:    g.gameId as string,
                gameName:  info?.gameName ?? g.gameId,
                thumbnail: info?.thumbnail ?? null,
                wagered:   Number(g.wagered),
                won:       Number(g.won),
                ggr:       Number(g.wagered) - Number(g.won),
                txCount:   Number(g.txCount),
              };
            }),
          },
          timeSeries: {
            dailyActivity: dailyActivity.map((d: any) => ({
              date:      String(d.date),
              wagered:   Number(d.wagered),
              won:       Number(d.won),
              deposited: Number(d.deposited),
            })),
            depositHistory: depositHistory.map((t) => ({
              id:        t.id,
              amount:    Number(t.amount),
              status:    t.status,
              createdAt: t.createdAt,
            })),
            withdrawalHistory: withdrawalHistory.map((t) => ({
              id:        t.id,
              amount:    Number(t.amount),
              status:    t.status,
              createdAt: t.createdAt,
            })),
          },
        },
      };
    } catch (err: any) {
      this.logger.error('getUserAnalytics failed:', err?.message, err?.stack);
      return { code: 500, data: null, message: err?.message ?? 'Analytics error' };
    }
  }
}
