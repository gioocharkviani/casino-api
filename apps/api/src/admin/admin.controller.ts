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
import { gameCategoriesEnum } from 'libs/common/enums/gameCategories.enum';

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

  // ── PROMOTIONS CRUD ───────────────────────────────
  @Post('promotions')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  createPromotion(@Body() dto: CreatePromotionDto, @Req() req: Request) {
    return this.adminService.createPromotion(dto, (req as any).adminId);
  }

  @Get('promotions')
  @UseGuards(AdminGuard)
  listPromotions() {
    return this.adminService.listPromotions();
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
  getUsers() {
    return this.adminService.getUsers();
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
    @Query('category') category?: gameCategoriesEnum,
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
    @Body() body: { category: gameCategoriesEnum },
  ) {
    return this.adminService.addGameToCategory(id, body.category);
  }

  @Delete('games/:id/category/:category')
  @UseGuards(AdminGuard)
  @RequireAdminRole(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  removeGameFromCategory(
    @Param('id', ParseIntPipe) id: number,
    @Param('category') category: gameCategoriesEnum,
  ) {
    return this.adminService.removeGameFromCategory(id, category);
  }

  @Get('games/:id/categories')
  @UseGuards(AdminGuard)
  getGameCategories(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getGameCategories(id);
  }
}
