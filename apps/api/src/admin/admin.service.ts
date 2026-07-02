import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  AdminEntity,
  AdminRole,
  AdminSessionEntity,
} from 'libs/database/entities/admin.entity';
import {
  AdminSignInDto,
  CreateAdminDto,
  UpdateAdminDto,
} from 'libs/common/dto/admin.dto';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  AssignPromotionDto,
} from 'libs/common/dto/promotion.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(AdminSessionEntity)
    private readonly sessionRepo: Repository<AdminSessionEntity>,
    @Inject('PROMO_MS_SERVICE')
    private readonly promoClient: ClientProxy,
    @Inject('USER_MS_SERVICE')
    private readonly userClient: ClientProxy,
    @Inject('GAME_MS_SERVICE')
    private readonly gameClient: ClientProxy,
    @Inject('WALLET_MS_SERVICE')
    private readonly walletClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  // ── AUTH ──────────────────────────────────────────
  async signIn(dto: AdminSignInDto, ip?: string) {
    const admin = await this.adminRepo.findOne({
      where: { username: dto.username },
    });
    if (!admin || !admin.isActive) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      };
    }

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');

    const expireHours = parseInt(
      this.configService.get('ADMIN_TOKEN_EXPIRE_HOURS') || '8',
      10,
    );
    const expiresAt = new Date(Date.now() + expireHours * 3_600_000);

    await this.sessionRepo.save(
      this.sessionRepo.create({
        token,
        adminId: admin.id,
        adminRole: admin.role,
        ip: ip ?? '',
        expiresAt,
      }),
    );

    const { password, ...safe } = admin;
    return { statusCode: 200, data: { admin: safe, token }, message: 'OK' };
  }

  async signOut(token: string) {
    const session = await this.sessionRepo.findOne({ where: { token } });
    if (session) {
      session.token = null;
      await this.sessionRepo.save(session);
    }
    return { statusCode: 200, message: 'Signed out' };
  }

  // ── ADMIN MANAGEMENT (super_admin only) ───────────
  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.adminRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Username or email already in use',
      };
    }

    const salt = parseInt(
      this.configService.get('BCRYPT_SALT') || '10',
      10,
    );
    const hashed = await bcrypt.hash(dto.password, salt);

    const admin = this.adminRepo.create({
      ...dto,
      password: hashed,
      role: dto.role ?? AdminRole.MODERATOR,
    });
    const saved = await this.adminRepo.save(admin);
    const { password, ...safe } = saved;
    return { statusCode: 200, data: safe, message: 'Admin created' };
  }

  async listAdmins() {
    const admins = await this.adminRepo.find({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
    return { statusCode: 200, data: admins };
  }

  async updateAdmin(id: string, dto: UpdateAdminDto) {
    const admin = await this.adminRepo.findOne({ where: { id } });
    if (!admin) {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'Admin not found' };
    }

    if (dto.email) admin.email = dto.email;
    if (dto.firstName !== undefined) admin.firstName = dto.firstName;
    if (dto.lastName !== undefined) admin.lastName = dto.lastName;
    if (dto.role) admin.role = dto.role;

    if (dto.newPassword) {
      const salt = parseInt(this.configService.get('BCRYPT_SALT') || '10', 10);
      admin.password = await bcrypt.hash(dto.newPassword, salt);
    }

    const saved = await this.adminRepo.save(admin);
    const { password, ...safe } = saved;
    return { statusCode: 200, data: safe, message: 'Admin updated' };
  }

  async deactivateAdmin(id: string) {
    await this.adminRepo.update(id, { isActive: false });
    return { statusCode: 200, message: 'Admin deactivated' };
  }

  // ── PROMOTIONS (proxy to Promotions MS) ───────────
  async createPromotion(dto: CreatePromotionDto, adminId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_CREATE', { ...dto, performedBy: adminId }),
    );
  }

  async updatePromotion(id: string, dto: UpdatePromotionDto, adminId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_UPDATE', {
        ...dto,
        id,
        performedBy: adminId,
      }),
    );
  }

  async listPromotions(filters?: { page?: number; limit?: number; type?: string; status?: string }) {
    return lastValueFrom(this.promoClient.send('PROMO_LIST', filters ?? {}));
  }

  async activateBonusForUser(userId: string, userPromotionId: string) {
    return lastValueFrom(this.promoClient.send('PROMO_ACTIVATE', { userId, userPromotionId }));
  }

  async chooseGameForUser(userId: string, userPromotionId: string, gameUUID: string) {
    return lastValueFrom(this.promoClient.send('PROMO_CHOOSE_GAME', { userId, userPromotionId, gameUUID }));
  }

  async getEligibleGamesForUser(userId: string, userPromotionId: string) {
    return lastValueFrom(this.promoClient.send('PROMO_ELIGIBLE_GAMES', { userId, userPromotionId }));
  }

  async getPromotion(id: string) {
    return lastValueFrom(this.promoClient.send('PROMO_GET', id));
  }

  async deletePromotion(id: string, adminId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_DELETE', { id, performedBy: adminId }),
    );
  }

  async assignPromotion(dto: AssignPromotionDto, adminId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_ASSIGN', {
        ...dto,
        performedBy: adminId,
      }),
    );
  }

  async cancelUserBonus(userPromotionId: string, adminId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_CANCEL_USER_BONUS', {
        userPromotionId,
        performedBy: adminId,
      }),
    );
  }

  async getUserBonuses(userId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_ADMIN_USER_BONUSES', userId),
    );
  }

  async getWageringOverview(filters?: { page?: number; limit?: number; status?: string; userId?: string }) {
    return lastValueFrom(
      this.promoClient.send('ADMIN_GET_WAGERING', filters ?? {}),
    );
  }

  async getAuditLog(promotionId?: string, userId?: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_AUDIT_LOG', {
        promotionId,
        userId,
      }),
    );
  }

  // ── USERS (proxy to User MS) ──────────────────────
  async getUsers(filters?: { page?: number; limit?: number; search?: string; isBlocked?: boolean; verified?: boolean }) {
    try {
      return await lastValueFrom(this.userClient.send('ADMIN_GET_USERS', filters ?? {}));
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async updateUser(userId: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; userName?: string; birthday?: string }) {
    try {
      return await lastValueFrom(this.userClient.send('ADMIN_UPDATE_USER', { userId, ...data }));
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async getUserById(userId: string) {
    try {
      const result = await lastValueFrom(
        this.userClient.send('ADMIN_GET_USER_BY_ID', userId),
      );
      return result;
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async blockUser(userId: string, reason?: string) {
    try {
      return await lastValueFrom(
        this.userClient.send('ADMIN_BLOCK_USER', { userId, reason }),
      );
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async unblockUser(userId: string) {
    try {
      return await lastValueFrom(
        this.userClient.send('ADMIN_UNBLOCK_USER', userId),
      );
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async activateUser(userId: string) {
    try {
      return await lastValueFrom(
        this.userClient.send('ADMIN_ACTIVATE_USER', userId),
      );
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async setPersonalId(userId: string, personalId: string) {
    try {
      return await lastValueFrom(
        this.userClient.send('ADMIN_SET_PERSONAL_ID', { userId, personalId }),
      );
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async getUserTransactions(userId: string, limit?: number) {
    try {
      return await lastValueFrom(
        this.walletClient.send('ADMIN_USER_TRANSACTIONS', { userId, limit }),
      );
    } catch {
      return { statusCode: 500, message: 'Wallet service unavailable' };
    }
  }

  async getUserWagering(userId: string) {
    try {
      return await lastValueFrom(this.userClient.send('ADMIN_GET_USER_WAGERING', userId));
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async getAllWagering(filters?: { page?: number; limit?: number; search?: string }) {
    try {
      return await lastValueFrom(this.userClient.send('ADMIN_GET_ALL_WAGERING', filters ?? {}));
    } catch {
      return { statusCode: 500, message: 'User service unavailable' };
    }
  }

  async adjustUserBalance(
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    reason: string,
    adminId: string,
  ) {
    try {
      return await lastValueFrom(
        this.walletClient.send('ADMIN_ADJUST_BALANCE', {
          userId,
          amount,
          type,
          reason,
          adminId,
        }),
      );
    } catch {
      return { statusCode: 500, message: 'Wallet service unavailable' };
    }
  }

  // ── GAMES ─────────────────────────────────────────
  async adminGetAllGames(filters: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    isActive?: boolean;
    category?: string;
  }) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_GET_ALL_GAMES', filters),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async showGame(gameId: number) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_SHOW_GAME', gameId),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async hideGame(gameId: number) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_HIDE_GAME', gameId),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async addGameToCategory(gameId: number, category: string) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_ADD_GAME_CATEGORY', { gameId, category }),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async removeGameFromCategory(gameId: number, category: string) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_REMOVE_GAME_CATEGORY', { gameId, category }),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getGameCategories(gameId: number) {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_GET_GAME_CATEGORIES', gameId),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getGameProviders() {
    try {
      return await lastValueFrom(this.gameClient.send('ADMIN_GET_PROVIDERS', {}));
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getCategoryOverview() {
    try {
      return await lastValueFrom(
        this.gameClient.send('ADMIN_GET_CATEGORY_OVERVIEW', {}),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getGameDemoUrl(gameId: string, lang?: string) {
    try {
      return await lastValueFrom(
        this.gameClient.send('REVOLVER_GET_DEMO_URL', { gameId, lang }),
      );
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getAllTransactions(filters: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
  }) {
    try {
      return await lastValueFrom(
        this.walletClient.send('ADMIN_ALL_TRANSACTIONS', filters),
      );
    } catch {
      return { statusCode: 500, message: 'Wallet service unavailable' };
    }
  }

  async listCategoryDefs() {
    try {
      return await lastValueFrom(this.gameClient.send('ADMIN_LIST_CATEGORY_DEFS', {}));
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async createCategoryDef(data: { key: string; label: string; color?: string; sortOrder?: number }) {
    try {
      return await lastValueFrom(this.gameClient.send('ADMIN_CREATE_CATEGORY_DEF', data));
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async deleteCategoryDef(key: string) {
    try {
      return await lastValueFrom(this.gameClient.send('ADMIN_DELETE_CATEGORY_DEF', key));
    } catch {
      return { statusCode: 500, message: 'Game service unavailable' };
    }
  }

  async getPlatformStats() {
    try {
      const [allUsersRes, activeRes, blockedRes, unverifiedRes, gamesRes] = await Promise.all([
        lastValueFrom(this.userClient.send('ADMIN_GET_USERS', { limit: 1 })).catch(() => ({ total: 0 })),
        lastValueFrom(this.userClient.send('ADMIN_GET_USERS', { limit: 1, verified: true, isBlocked: false })).catch(() => ({ total: 0 })),
        lastValueFrom(this.userClient.send('ADMIN_GET_USERS', { limit: 1, isBlocked: true })).catch(() => ({ total: 0 })),
        lastValueFrom(this.userClient.send('ADMIN_GET_USERS', { limit: 1, verified: false, isBlocked: false })).catch(() => ({ total: 0 })),
        lastValueFrom(this.gameClient.send('ADMIN_GET_ALL_GAMES', { limit: 1 })).catch(() => ({ total: 0 })),
      ]);

      return {
        statusCode: 200,
        data: {
          users: {
            total:      allUsersRes?.total      ?? 0,
            active:     activeRes?.total        ?? 0,
            blocked:    blockedRes?.total       ?? 0,
            unverified: unverifiedRes?.total    ?? 0,
          },
          games: { total: gamesRes?.total ?? 0 },
        },
      };
    } catch {
      return { statusCode: 500, message: 'Stats unavailable' };
    }
  }
}
