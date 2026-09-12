import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { AdminGuard, RequireAdminRole } from 'libs/guards/admin.guard';
import { AdminRole } from 'libs/database/entities/admin.entity';
import {
  AdminSignInDto,
  CreateAdminDto,
  UpdateAdminDto,
} from 'libs/common/dto/admin.dto';
import {
  AssignPromotionDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from 'libs/common/dto/promotion.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── AUTH ──────────────────────────────────────────
  @Post('sign-in')
  @HttpCode(200)
  signIn(@Body() dto: AdminSignInDto, @Ip() ip: string) {
    return this.adminService.signIn(dto, ip);
  }

  @Post('sign-out')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  signOut(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1] ?? '';
    return this.adminService.signOut(token);
  }

  // ── ADMIN MANAGEMENT (super_admin only) ───────────
  @Post('admins')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Get('admins')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN)
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @Put('admins/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN)
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.updateAdmin(id, dto);
  }

  @Delete('admins/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN)
  deactivateAdmin(@Param('id') id: string) {
    return this.adminService.deactivateAdmin(id);
  }

  // Admin do user bonus actions on behalf of a user
  @Post('users/:userId/bonuses/:bonusId/activate')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  activateBonusForUser(
    @Param('userId') userId: string,
    @Param('bonusId') bonusId: string,
  ) {
    return this.adminService.activateBonusForUser(userId, bonusId);
  }

  @Post('users/:userId/bonuses/:bonusId/choose-game')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  chooseGameForUser(
    @Param('userId') userId: string,
    @Param('bonusId') bonusId: string,
    @Body() body: { gameUUID: string },
  ) {
    return this.adminService.chooseGameForUser(userId, bonusId, body.gameUUID);
  }

  @Get('users/:userId/bonuses/:bonusId/eligible-games')
  @UseGuards(AdminGuard)
  getEligibleGamesForUser(
    @Param('userId') userId: string,
    @Param('bonusId') bonusId: string,
  ) {
    return this.adminService.getEligibleGamesForUser(userId, bonusId);
  }

  // ── PROMOTIONS CRUD ───────────────────────────────
  @Post('promotions')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto, @Req() req: Request) {
    return this.adminService.createPromotion(dto, (req as any).adminId);
  }

  @Get('promotions')
  @UseGuards(AdminGuard)
  listPromotions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listPromotions({
      page:   page   ? parseInt(page, 10)  : undefined,
      limit:  limit  ? parseInt(limit, 10) : undefined,
      type:   type   || undefined,
      status: status || undefined,
    });
  }

  @Get('promotions/:id')
  @UseGuards(AdminGuard)
  getPromotion(@Param('id') id: string) {
    return this.adminService.getPromotion(id);
  }

  @Put('promotions/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  updatePromotion(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @Req() req: Request,
  ) {
    return this.adminService.updatePromotion(id, dto, (req as any).adminId);
  }

  @Delete('promotions/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  deletePromotion(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.deletePromotion(id, (req as any).adminId);
  }

  // ── ASSIGN / MANAGE USER BONUSES ─────────────────
  @Post('promotions/assign')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  assignPromotion(@Body() dto: AssignPromotionDto, @Req() req: Request) {
    return this.adminService.assignPromotion(dto, (req as any).adminId);
  }

  @Delete('bonuses/:userPromotionId')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  cancelBonus(
    @Param('userPromotionId') userPromotionId: string,
    @Req() req: Request,
  ) {
    return this.adminService.cancelUserBonus(
      userPromotionId,
      (req as any).adminId,
    );
  }

  @Get('users/:userId/bonuses')
  @UseGuards(AdminGuard)
  getUserBonuses(@Param('userId') userId: string) {
    return this.adminService.getUserBonuses(userId);
  }

  // ── WAGERING ──────────────────────────────────────
  @Get('wagering')
  @UseGuards(AdminGuard)
  getWagering(
    @Query('page')   page?:   string,
    @Query('limit')  limit?:  string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getWageringOverview({
      page:   page  ? parseInt(page, 10)  : undefined,
      limit:  limit ? parseInt(limit, 10) : undefined,
      status: status || undefined,
      userId: userId || undefined,
    });
  }

  // ── AUDIT LOG ─────────────────────────────────────
  @Get('audit')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  getAuditLog(
    @Query('promotionId') promotionId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAuditLog(promotionId, userId);
  }

  // ── USER MANAGEMENT ───────────────────────────────
  @Get('users')
  @UseGuards(AdminGuard)
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('verified') verified?: string,
  ) {
    return this.adminService.getUsers({
      page:      page      ? parseInt(page, 10)  : undefined,
      limit:     limit     ? parseInt(limit, 10) : undefined,
      search:    search    || undefined,
      isBlocked: isBlocked !== undefined ? isBlocked === 'true'  : undefined,
      verified:  verified  !== undefined ? verified  === 'true'  : undefined,
    });
  }

  @Get('users/:userId')
  @UseGuards(AdminGuard)
  getUser(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Put('users/:userId/block')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  blockUser(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.blockUser(userId, body.reason);
  }

  @Put('users/:userId/unblock')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  unblockUser(@Param('userId') userId: string) {
    return this.adminService.unblockUser(userId);
  }

  @Put('users/:userId/activate')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  activateUser(@Param('userId') userId: string) {
    return this.adminService.activateUser(userId);
  }

  @Put('users/:userId/profile')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  updateUser(
    @Param('userId') userId: string,
    @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string; userName?: string; birthday?: string },
  ) {
    return this.adminService.updateUser(userId, body);
  }

  @Put('users/:userId/personal-id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  setPersonalId(
    @Param('userId') userId: string,
    @Body() body: { personalId: string },
  ) {
    return this.adminService.setPersonalId(userId, body.personalId);
  }

  @Get('users/:userId/transactions')
  @UseGuards(AdminGuard)
  getUserTransactions(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUserTransactions(
      userId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('users/:userId/balance')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN)
  adjustBalance(
    @Param('userId') userId: string,
    @Body()
    body: { amount: number; type: 'credit' | 'debit'; reason: string },
    @Req() req: Request,
  ) {
    return this.adminService.adjustUserBalance(
      userId,
      body.amount,
      body.type,
      body.reason,
      (req as any).adminId,
    );
  }

  // ── GAME MANAGEMENT ───────────────────────────────
  @Get('games')
  @UseGuards(AdminGuard)
  adminGetAllGames(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('provider') provider?: string,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.adminGetAllGames({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      provider,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      category,
    });
  }

  @Put('games/:id/show')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  showGame(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.showGame(id);
  }

  @Put('games/:id/hide')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  hideGame(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.hideGame(id);
  }

  @Post('games/:id/category')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  addGameToCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { category: string },
  ) {
    return this.adminService.addGameToCategory(id, body.category);
  }

  @Delete('games/:id/category/:category')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  removeGameFromCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('category') category: string,
  ) {
    return this.adminService.removeGameFromCategory(id, category);
  }

  @Get('games/:id/categories')
  @UseGuards(AdminGuard)
  getGameCategories(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getGameCategories(id);
  }

  @Get('games/demo-url')
  @UseGuards(AdminGuard)
  getGameDemoUrl(@Query('gameId') gameId: string, @Query('lang') lang?: string) {
    return this.adminService.getGameDemoUrl(gameId, lang);
  }

  @Get('games/providers')
  @UseGuards(AdminGuard)
  getGameProviders() {
    return this.adminService.getGameProviders();
  }

  @Get('games/category-overview')
  @UseGuards(AdminGuard)
  getCategoryOverview() {
    return this.adminService.getCategoryOverview();
  }

  // ── CATEGORY DEFINITIONS ─────────────────────────
  @Get('category-defs')
  @UseGuards(AdminGuard)
  listCategoryDefs() {
    return this.adminService.listCategoryDefs();
  }

  @Post('category-defs')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  createCategoryDef(
    @Body() body: { key: string; label: string; color?: string; sortOrder?: number },
  ) {
    return this.adminService.createCategoryDef(body);
  }

  @Delete('category-defs/:key')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  deleteCategoryDef(@Param('key') key: string) {
    return this.adminService.deleteCategoryDef(key);
  }

  // ── USER LEVELS ───────────────────────────────────
  @Get('levels')
  @UseGuards(AdminGuard)
  listLevels() {
    return this.adminService.listLevels();
  }

  @Post('levels')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  createLevel(
    @Body() body: { name: string; minPoints: number; maxPoints: number; order?: number; description?: string; badgeUrl?: string },
  ) {
    return this.adminService.createLevel(body);
  }

  @Put('levels/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  updateLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; minPoints?: number; maxPoints?: number; order?: number; description?: string; badgeUrl?: string; isActive?: boolean },
  ) {
    return this.adminService.updateLevel(id, body);
  }

  @Delete('levels/:id')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  deleteLevel(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteLevel(id);
  }

  // ── ANALYTICS ─────────────────────────────────────
  @Get('analytics')
  @UseGuards(AdminGuard)
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('analytics/users/:userId')
  @UseGuards(AdminGuard)
  getUserAnalytics(@Param('userId') userId: string) {
    return this.adminService.getUserAnalytics(userId);
  }

  // ── PLATFORM STATS ────────────────────────────────
  @Get('stats')
  @UseGuards(AdminGuard)
  getPlatformStats() {
    return this.adminService.getPlatformStats();
  }

  // ── ALL TRANSACTIONS (paginated) ──────────────────
  @Get('transactions')
  @UseGuards(AdminGuard)
  getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('provider') provider?: string,
    @Query('gameId') gameId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minAmount') minAmount?: string,
    @Query('maxAmount') maxAmount?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'amount',
    @Query('sortDir') sortDir?: 'ASC' | 'DESC',
  ) {
    return this.adminService.getAllTransactions({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type: type || undefined,
      status: status || undefined,
      userId: userId || undefined,
      provider: provider || undefined,
      gameId: gameId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount ? parseInt(minAmount, 10) : undefined,
      maxAmount: maxAmount ? parseInt(maxAmount, 10) : undefined,
      sortBy: sortBy || undefined,
      sortDir: sortDir || undefined,
    });
  }

  // ── PER-USER: where they spend the most (by game / provider) ──
  @Get('users/:userId/top-spend')
  @UseGuards(AdminGuard)
  getUserTopSpend(
    @Param('userId') userId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getUserTopSpend(userId, dateFrom, dateTo);
  }

  // ── WITHDRAWAL APPROVAL ────────────────────────────
  @Put('withdrawals/:id/approve')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  approveWithdrawal(@Param('id') id: string) {
    return this.adminService.approveWithdrawal(id);
  }

  @Put('withdrawals/:id/reject')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  rejectWithdrawal(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectWithdrawal(id, reason || 'No reason provided');
  }

  // ── GAME PERFORMANCE REPORT ────────────────────────
  @Get('reports/games')
  @UseGuards(AdminGuard)
  getGameReport(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getGameReport(dateFrom, dateTo);
  }

  // ── LIVE SESSIONS ─────────────────────────────────
  @Get('live/sessions')
  @UseGuards(AdminGuard)
  getLiveSessions() {
    return this.adminService.getLiveSessions();
  }

  @Put('live/sessions/:id/close')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  forceCloseSession(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.forceCloseSession(id);
  }
}
