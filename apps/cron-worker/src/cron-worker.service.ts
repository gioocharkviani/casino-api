import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminSessionEntity } from 'libs/database/entities/admin.entity';
import { UserSessionEntity, userVerificationEntity } from 'libs/database/entities/user.entity';
import { GameSession } from 'libs/database/entities/game.entity';
import { UserPromotionEntity } from 'libs/database/entities/promotions.entity';
import { UserPromotionStatus } from 'libs/database/entities/promotions.entity';

@Injectable()
export class CronWorkerService {
  private readonly logger = new Logger(CronWorkerService.name);

  constructor(
    @InjectRepository(AdminSessionEntity)
    private readonly adminSessionRepo: Repository<AdminSessionEntity>,

    @InjectRepository(UserSessionEntity)
    private readonly userSessionRepo: Repository<UserSessionEntity>,

    @InjectRepository(userVerificationEntity)
    private readonly verifyRepo: Repository<userVerificationEntity>,

    @InjectRepository(GameSession)
    private readonly gameSessionRepo: Repository<GameSession>,

    @InjectRepository(UserPromotionEntity)
    private readonly userPromoRepo: Repository<UserPromotionEntity>,
  ) {}

  // ── Every 10 minutes: expire admin sessions (null token, keep row) ────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanAdminSessions() {
    const now = new Date();
    const result = await this.adminSessionRepo
      .createQueryBuilder()
      .update()
      .set({ token: null })
      .where('expiresAt < :now', { now })
      .andWhere('token IS NOT NULL')
      .execute();
    if (result.affected) {
      this.logger.log(`Expired token on ${result.affected} admin session(s)`);
    }
  }

  // ── Every 10 minutes: expire user sessions (null token, keep row) ─────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanUserSessions() {
    const now = new Date();
    const result = await this.userSessionRepo
      .createQueryBuilder()
      .update()
      .set({ token: null })
      .where('expiresAt < :now', { now })
      .andWhere('token IS NOT NULL')
      .execute();
    if (result.affected) {
      this.logger.log(`Expired token on ${result.affected} user session(s)`);
    }
  }

  // ── Every 10 minutes: expire OTP tokens (null otp, keep row) ──────────────
  @Cron(CronExpression.EVERY_10_MINUTES)
  async cleanVerificationTokens() {
    const now = new Date();
    const result = await this.verifyRepo
      .createQueryBuilder()
      .update()
      .set({ otp: () => 'NULL' })
      .where('expiresAt < :now', { now })
      .andWhere('otp IS NOT NULL')
      .execute();
    if (result.affected) {
      this.logger.log(`Expired OTP on ${result.affected} verification record(s)`);
    }
  }

  // ── Every hour: deactivate game sessions older than 24 hours ─────────────
  @Cron(CronExpression.EVERY_HOUR)
  async cleanGameSessions() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.gameSessionRepo
      .createQueryBuilder()
      .update()
      .set({ token: null, isActive: false })
      .where('createdAt < :cutoff', { cutoff })
      .andWhere('isActive = true')
      .execute();
    if (result.affected) {
      this.logger.log(`Deactivated ${result.affected} old game session(s)`);
    }
  }

  // ── Every 30 minutes: expire overdue user promotions ─────────────────────
  @Cron(CronExpression.EVERY_30_MINUTES)
  async expireUserPromotions() {
    const now = new Date();
    const result = await this.userPromoRepo
      .createQueryBuilder()
      .update()
      .set({ status: UserPromotionStatus.EXPIRED })
      .where('expiresAt < :now', { now })
      .andWhere('status IN (:...statuses)', {
        statuses: [UserPromotionStatus.ASSIGNED, UserPromotionStatus.ACTIVE],
      })
      .execute();
    if (result.affected) {
      this.logger.log(`Expired ${result.affected} overdue user promotion(s)`);
    }
  }
}
