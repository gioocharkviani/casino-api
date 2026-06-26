import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource, Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import {
  PromotionEntity,
  UserPromotionEntity,
  PromotionAuditEntity,
  PromotionStatus,
  UserPromotionStatus,
  RewardType,
  PromotionAuditAction,
} from 'libs/database/entities/promotions.entity';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  AssignPromotionDto,
  ActivateBonusDto,
  RedeemPromoCodeDto,
  PromoTriggerEventDto,
} from 'libs/common/dto/promotion.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(PromotionEntity)
    private readonly promoRepo: Repository<PromotionEntity>,
    @InjectRepository(UserPromotionEntity)
    private readonly userPromoRepo: Repository<UserPromotionEntity>,
    @InjectRepository(PromotionAuditEntity)
    private readonly auditRepo: Repository<PromotionAuditEntity>,
    @Inject('WALLET_MS_SERVICE')
    private readonly walletClient: ClientProxy,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  async create(dto: CreatePromotionDto) {
    try {
      const promo = this.promoRepo.create({
        ...dto,
        status: PromotionStatus.DRAFT,
        gameWeights: dto.gameWeights ?? {},
        maxUsagePerUser: dto.maxUsagePerUser ?? 1,
        validityHours: dto.validityHours ?? 72,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      });
      const saved = await this.promoRepo.save(promo);

      await this.writeAudit(PromotionAuditAction.CREATED, {
        promotionId: saved.id,
        performedBy: dto.performedBy,
      });

      return { code: 200, data: saved, message: 'Promotion created' };
    } catch (err: any) {
      this.logger.error(`create failed: ${err.message}`);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // ─────────────────────────────────────────────
  // UPDATE (also pause / resume / archive)
  // ─────────────────────────────────────────────
  async update(dto: UpdatePromotionDto) {
    try {
      const promo = await this.promoRepo.findOne({ where: { id: dto.id } });
      if (!promo) {
        return { code: 1601, data: null, message: 'Promotion not found' };
      }

      const { id, startDate, endDate, performedBy, ...rest } = dto;
      Object.assign(promo, rest);
      if (startDate) promo.startDate = new Date(startDate);
      if (endDate) promo.endDate = new Date(endDate);

      const saved = await this.promoRepo.save(promo);

      await this.writeAudit(PromotionAuditAction.UPDATED, {
        promotionId: saved.id,
        performedBy,
        metadata: rest as Record<string, any>,
      });

      return { code: 200, data: saved, message: 'Promotion updated' };
    } catch (err: any) {
      this.logger.error(`update failed: ${err.message}`);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  async findOne(id: string) {
    const promo = await this.promoRepo.findOne({ where: { id } });
    return promo
      ? { code: 200, data: promo, message: 'Success' }
      : { code: 1601, data: null, message: 'Promotion not found' };
  }

  async findAll() {
    const data = await this.promoRepo.find({ order: { createdAt: 'DESC' } });
    return { code: 200, data, message: 'Success' };
  }

  async delete(id: string, performedBy?: string) {
    try {
      const promo = await this.promoRepo.findOne({ where: { id } });
      if (!promo) {
        return { code: 1601, data: null, message: 'Promotion not found' };
      }
      promo.status = PromotionStatus.ARCHIVED;
      await this.promoRepo.save(promo);

      await this.writeAudit(PromotionAuditAction.CANCELLED, {
        promotionId: id,
        performedBy,
      });

      return { code: 200, data: null, message: 'Promotion archived' };
    } catch (err: any) {
      this.logger.error(`delete failed: ${err.message}`);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // ─────────────────────────────────────────────
  // ASSIGN TO USER (admin action)
  // ─────────────────────────────────────────────
  async assignToUser(dto: AssignPromotionDto) {
    try {
      const promo = await this.promoRepo.findOne({
        where: { id: dto.promotionId },
      });
      if (!promo) {
        return { code: 1601, data: null, message: 'Promotion not found' };
      }
      if (promo.status !== PromotionStatus.ACTIVE) {
        return { code: 1602, data: null, message: 'Promotion is not active' };
      }

      const usageCount = await this.userPromoRepo.count({
        where: { userId: dto.userId, promotionId: dto.promotionId },
      });
      if (usageCount >= promo.maxUsagePerUser) {
        return {
          code: 1603,
          data: null,
          message: 'Usage limit reached for this user',
        };
      }

      const assignment = this.userPromoRepo.create({
        userId: dto.userId,
        promotionId: dto.promotionId,
        status: UserPromotionStatus.ASSIGNED,
        bonusBalance: 0,
        wageringRequired: 0,
        wageringCompleted: 0,
      });
      const saved = await this.userPromoRepo.save(assignment);

      await this.writeAudit(PromotionAuditAction.ASSIGNED, {
        promotionId: promo.id,
        userId: dto.userId,
        performedBy: dto.performedBy,
        metadata: { overrideAmount: dto.overrideAmount },
      });

      return { code: 200, data: saved, message: 'Promotion assigned to user' };
    } catch (err: any) {
      this.logger.error(`assign failed: ${err.message}`);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // ─────────────────────────────────────────────
  // ACTIVATE (user clicks "claim bonus")
  // ─────────────────────────────────────────────
  async activate(dto: ActivateBonusDto) {
    return this.dataSource.transaction(async (mgr) => {
      const upRepo = mgr.getRepository(UserPromotionEntity);

      const assignment = await upRepo.findOne({
        where: { id: dto.userPromotionId, userId: dto.userId },
        relations: { promotion: true },
      });
      if (!assignment) {
        return { code: 1604, data: null, message: 'Assigned bonus not found' };
      }
      if (assignment.status !== UserPromotionStatus.ASSIGNED) {
        return {
          code: 1605,
          data: null,
          message: `Bonus is already ${assignment.status}`,
        };
      }

      const promo = assignment.promotion;
      if (promo.status !== PromotionStatus.ACTIVE) {
        return { code: 1602, data: null, message: 'Promotion no longer active' };
      }

      const grant = this.computeGrant(promo);
      if (grant <= 0) {
        return {
          code: 1606,
          data: null,
          message: 'Nothing to grant for this bonus',
        };
      }

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + promo.validityHours * 3_600_000,
      );

      // wager-free → credit real wallet immediately
      if (
        promo.wageringMultiplier === 0 &&
        promo.rewardType === RewardType.REAL_BALANCE
      ) {
        const credited = await this.creditWallet(
          dto.userId,
          grant,
          `promo-${assignment.id}`,
          `Bonus ${promo.name} (wager-free)`,
        );
        if (!credited) {
          return { code: 1607, data: null, message: 'Wallet credit failed' };
        }
        assignment.status = UserPromotionStatus.COMPLETED;
        assignment.activatedAt = now;
        assignment.expiresAt = expiresAt;
      } else {
        // wagered → lock in isolated bonus balance
        assignment.bonusBalance = grant;
        assignment.wageringRequired = grant * promo.wageringMultiplier;
        assignment.wageringCompleted = 0;
        assignment.status = UserPromotionStatus.ACTIVE;
        assignment.activatedAt = now;
        assignment.expiresAt = expiresAt;
      }

      const saved = await upRepo.save(assignment);

      await this.writeAudit(PromotionAuditAction.ACTIVATED, {
        promotionId: promo.id,
        userId: dto.userId,
        performedBy: 'user',
        metadata: { grant, wageringRequired: saved.wageringRequired },
      });

      return {
        code: 200,
        data: {
          userPromotionId: saved.id,
          status: saved.status,
          bonusBalance: saved.bonusBalance,
          wageringRequired: saved.wageringRequired,
          expiresAt: saved.expiresAt,
        },
        message: 'Bonus activated',
      };
    });
  }

  // ─────────────────────────────────────────────
  // REDEEM PROMO CODE (assign + activate in one step)
  // ─────────────────────────────────────────────
  async redeemCode(dto: RedeemPromoCodeDto) {
    const promo = await this.promoRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PromotionStatus.ACTIVE })
      .andWhere(
        `JSON_UNQUOTE(JSON_EXTRACT(p.triggerCondition, '$.promoCode')) = :code`,
        { code: dto.code },
      )
      .getOne();

    if (!promo) {
      return {
        code: 1608,
        data: null,
        message: 'Invalid or expired promo code',
      };
    }

    const assigned = await this.assignToUser({
      promotionId: promo.id,
      userId: dto.userId,
      performedBy: 'user:code',
    });
    if (assigned.code !== 200) return assigned;

    return this.activate({
      userId: dto.userId,
      userPromotionId: (assigned.data as any).id,
    });
  }

  // ─────────────────────────────────────────────
  // GET USER'S BONUSES
  // ─────────────────────────────────────────────
  async getUserBonuses(userId: string) {
    const data = await this.userPromoRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { code: 200, data, message: 'Success' };
  }

  // ─────────────────────────────────────────────
  // AUTO-GRANT TRIGGER (event-driven)
  // ─────────────────────────────────────────────
  async handleTriggerEvent(dto: PromoTriggerEventDto) {
    try {
      const allActive = await this.promoRepo.find({
        where: { status: PromotionStatus.ACTIVE },
      });

      for (const promo of allActive) {
        const trigger = promo.triggerCondition as Record<string, any> | null;
        if (!trigger?.eventType) continue;
        if (trigger.eventType !== dto.eventType) continue;

        // deposit minimum check
        if (
          trigger.minDeposit &&
          dto.amount !== undefined &&
          dto.amount < trigger.minDeposit
        ) {
          continue;
        }

        // check user hasn't already received this promo
        const existing = await this.userPromoRepo.count({
          where: { userId: dto.userId, promotionId: promo.id },
        });
        if (existing >= promo.maxUsagePerUser) continue;

        await this.assignToUser({
          promotionId: promo.id,
          userId: dto.userId,
          performedBy: 'system:auto',
        });

        this.logger.log(
          `Auto-assigned promo ${promo.name} to user ${dto.userId} via ${dto.eventType}`,
        );
      }
    } catch (err: any) {
      this.logger.error(`handleTriggerEvent failed: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────
  // ADMIN: list user bonuses
  // ─────────────────────────────────────────────
  async adminGetUserBonuses(userId: string) {
    const data = await this.userPromoRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { code: 200, data, message: 'Success' };
  }

  async cancelUserBonus(userPromotionId: string, performedBy: string) {
    const up = await this.userPromoRepo.findOne({
      where: { id: userPromotionId },
    });
    if (!up) return { code: 1604, data: null, message: 'Bonus not found' };

    up.status = UserPromotionStatus.CANCELLED;
    up.bonusBalance = 0;
    await this.userPromoRepo.save(up);

    await this.writeAudit(PromotionAuditAction.CANCELLED, {
      promotionId: up.promotionId,
      userId: up.userId,
      performedBy,
    });

    return { code: 200, data: null, message: 'Bonus cancelled' };
  }

  async getAuditLog(promotionId?: string, userId?: string) {
    const qb = this.auditRepo
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .take(500);

    if (promotionId) qb.andWhere('a.promotionId = :promotionId', { promotionId });
    if (userId) qb.andWhere('a.userId = :userId', { userId });

    const data = await qb.getMany();
    return { code: 200, data, message: 'Success' };
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private computeGrant(promo: PromotionEntity): number {
    const rv = (promo.rewardValue ?? {}) as Record<string, number>;
    if (rv.fixedAmount && rv.fixedAmount > 0) {
      return rv.maxAmount
        ? Math.min(rv.fixedAmount, rv.maxAmount)
        : rv.fixedAmount;
    }
    if (rv.percentage && rv.maxAmount) return rv.maxAmount;
    return 0;
  }

  private async creditWallet(
    playerId: string,
    amount: number,
    transactionId: string,
    reason: string,
  ): Promise<boolean> {
    try {
      const res: any = await lastValueFrom(
        this.walletClient
          .send('WALLET_CREDIT', {
            playerId,
            amount,
            transactionId,
            reason,
            gameId: 'bonus-system',
            roundId: transactionId,
            currency: 'USD',
            relatedExternalDebitTransactionId: transactionId,
          })
          .pipe(timeout(5000)),
      );
      return res?.code === 200;
    } catch (err: any) {
      this.logger.error(`creditWallet failed: ${err.message}`);
      return false;
    }
  }

  private async writeAudit(
    action: PromotionAuditAction,
    payload: Partial<PromotionAuditEntity>,
  ) {
    try {
      await this.auditRepo.save(this.auditRepo.create({ action, ...payload }));
    } catch (err: any) {
      this.logger.warn(`audit write failed: ${err.message}`);
    }
  }
}
