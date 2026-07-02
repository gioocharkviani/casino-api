import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource, Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import {
  PromotionEntity,
  PromotionType,
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
  ChooseGameDto,
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
    @Inject('GAME_MS_SERVICE')
    private readonly gameClient: ClientProxy,
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

  async findAll(filters?: { page?: number; limit?: number; type?: string; status?: string }) {
    const page  = filters?.page  ?? 1;
    const limit = Math.min(filters?.limit ?? 50, 200);
    const skip  = (page - 1) * limit;

    const qb = this.promoRepo.createQueryBuilder('p').orderBy('p.createdAt', 'DESC').skip(skip).take(limit);
    if (filters?.type)   qb.andWhere('p.type = :type',     { type:   filters.type });
    if (filters?.status) qb.andWhere('p.status = :status', { status: filters.status });

    const [data, total] = await qb.getManyAndCount();
    return { code: 200, data, total, page, totalPages: Math.ceil(total / limit), message: 'Success' };
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

      // Grant free spins via Revolver GAP API
      // Only fire immediately if admin pre-chose the games (userChoosesGame === false)
      if (
        promo.type === PromotionType.FREE_SPINS &&
        !promo.userChoosesGame &&
        promo.freeSpinsGameIds?.length
      ) {
        const spins = (promo.rewardValue as any)?.freeSpins ?? 10;
        const betAmount = promo.freeSpinsBetAmount ?? 100;
        const expiresAt = new Date(
          Date.now() + (promo.validityHours ?? 72) * 3_600_000,
        );
        for (const gameUUID of promo.freeSpinsGameIds) {
          await lastValueFrom(
            this.gameClient.send('REVOLVER_GRANT_FREE_SPINS', {
              playerId: dto.userId,
              game: gameUUID,
              numberOfFreeSpins: spins,
              betAmountPerFreeSpin: betAmount,
              currency: 'USD',
              expiresAt: expiresAt.toISOString(),
              transactionId: `fs-${saved.id}-${gameUUID.slice(0, 8)}`,
            }),
          );
        }
      }
      // If userChoosesGame=true: Revolver API fires later when user picks a game

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
  // CHOOSE GAME (user selects their game for free spins)
  // ─────────────────────────────────────────────
  async chooseGameAndActivate(dto: ChooseGameDto) {
    try {
      const assignment = await this.userPromoRepo.findOne({
        where: { id: dto.userPromotionId, userId: dto.userId },
        relations: { promotion: true },
      });
      if (!assignment) {
        return { code: 1604, data: null, message: 'Bonus not found' };
      }
      if (assignment.status !== UserPromotionStatus.ASSIGNED) {
        return { code: 1605, data: null, message: `Bonus is already ${assignment.status}` };
      }

      const promo = assignment.promotion;
      if (promo.type !== PromotionType.FREE_SPINS) {
        return { code: 1609, data: null, message: 'Only free spins bonuses support game selection' };
      }
      if (!promo.userChoosesGame) {
        return { code: 1610, data: null, message: 'This bonus does not allow game selection' };
      }

      // Validate that the game is in an eligible category (if restrictions set)
      // Note: for full validation, game service would be queried; here we trust the client
      // sent a valid game UUID that was shown from the eligible list

      const spins = (promo.rewardValue as any)?.freeSpins ?? 10;
      const betAmount = promo.freeSpinsBetAmount ?? 100;
      const expiresAt = new Date(Date.now() + (promo.validityHours ?? 72) * 3_600_000);

      const result = await lastValueFrom(
        this.gameClient.send('REVOLVER_GRANT_FREE_SPINS', {
          playerId: dto.userId,
          game: dto.gameUUID,
          numberOfFreeSpins: spins,
          betAmountPerFreeSpin: betAmount,
          currency: 'USD',
          expiresAt: expiresAt.toISOString(),
          transactionId: `fs-${assignment.id}-${dto.gameUUID.slice(0, 8)}`,
        }),
      );

      if (!result.success) {
        return { code: 1611, data: null, message: `Revolver API error: ${result.error}` };
      }

      assignment.status = UserPromotionStatus.ACTIVE;
      assignment.activatedAt = new Date();
      assignment.expiresAt = expiresAt;
      const saved = await this.userPromoRepo.save(assignment);

      await this.writeAudit(PromotionAuditAction.ACTIVATED, {
        promotionId: promo.id,
        userId: dto.userId,
        performedBy: 'user:choose_game',
        metadata: { gameUUID: dto.gameUUID, spins, betAmount },
      });

      return {
        code: 200,
        data: {
          userPromotionId: saved.id,
          status: saved.status,
          gameUUID: dto.gameUUID,
          freeSpins: spins,
          expiresAt: saved.expiresAt,
        },
        message: 'Free spins granted successfully',
      };
    } catch (err: any) {
      this.logger.error(`chooseGameAndActivate failed: ${err.message}`);
      return { code: 1500, data: null, message: 'Internal Error' };
    }
  }

  // ─────────────────────────────────────────────
  // GET ELIGIBLE GAMES for a user's pending free-spin bonus
  // ─────────────────────────────────────────────
  async getEligibleGames(userPromotionId: string, userId: string) {
    const assignment = await this.userPromoRepo.findOne({
      where: { id: userPromotionId, userId },
      relations: { promotion: true },
    });
    if (!assignment) {
      return { code: 1604, data: null, message: 'Bonus not found' };
    }
    const promo = assignment.promotion;
    return {
      code: 200,
      data: {
        userChoosesGame: promo.userChoosesGame,
        eligibleCategories: promo.eligibleCategories ?? [],
        freeSpinsGameIds: promo.freeSpinsGameIds ?? [],
        freeSpins: (promo.rewardValue as any)?.freeSpins ?? 10,
        betAmountPerFreeSpin: promo.freeSpinsBetAmount ?? 100,
      },
    };
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
      relations: { promotion: true },
      order: { createdAt: 'DESC' },
    });
    return { code: 200, data, message: 'Success' };
  }

  async adminGetWageringOverview(filters?: { page?: number; limit?: number; status?: string; userId?: string }) {
    const page  = filters?.page  ?? 1;
    const limit = Math.min(filters?.limit ?? 50, 200);
    const skip  = (page - 1) * limit;

    const qb = this.userPromoRepo
      .createQueryBuilder('up')
      .leftJoin('up.promotion', 'promo')
      .select([
        'up.id', 'up.userId', 'up.status',
        'up.bonusBalance', 'up.wageringRequired', 'up.wageringCompleted',
        'up.activatedAt', 'up.expiresAt', 'up.createdAt',
        'promo.id', 'promo.name', 'promo.type', 'promo.wageringMultiplier',
        'promo.allowedGameUUIDs',
      ])
      .orderBy('up.createdAt', 'DESC')
      .skip(skip).take(limit);

    if (filters?.status) {
      qb.andWhere('up.status = :status', { status: filters.status });
    } else {
      qb.andWhere('up.status IN (:...statuses)', { statuses: ['active', 'assigned'] });
    }
    if (filters?.userId) {
      qb.andWhere('up.userId = :userId', { userId: filters.userId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { code: 200, data, total, page, totalPages: Math.ceil(total / limit), message: 'Success' };
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
