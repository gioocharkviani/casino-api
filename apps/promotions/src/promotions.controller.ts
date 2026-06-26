import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PromotionsService } from './promotions.service';
import { WageringProgressService } from './wagering-progress.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  AssignPromotionDto,
  ActivateBonusDto,
  RedeemPromoCodeDto,
  BetSettledEventDto,
  PromoTriggerEventDto,
} from 'libs/common/dto/promotion.dto';

@Controller()
export class PromotionsController {
  constructor(
    private readonly promotionsService: PromotionsService,
    private readonly wageringService: WageringProgressService,
  ) {}

  // ── ADMIN: promotion template CRUD ───────────────
  @MessagePattern('PROMO_CREATE')
  create(@Payload() data: CreatePromotionDto) {
    return this.promotionsService.create(data);
  }

  @MessagePattern('PROMO_UPDATE')
  update(@Payload() data: UpdatePromotionDto) {
    return this.promotionsService.update(data);
  }

  @MessagePattern('PROMO_GET')
  getOne(@Payload() id: string) {
    return this.promotionsService.findOne(id);
  }

  @MessagePattern('PROMO_LIST')
  list() {
    return this.promotionsService.findAll();
  }

  @MessagePattern('PROMO_DELETE')
  remove(@Payload() data: { id: string; performedBy?: string }) {
    return this.promotionsService.delete(data.id, data.performedBy);
  }

  // ── ADMIN: assign a promotion to a user ──────────
  @MessagePattern('PROMO_ASSIGN')
  assign(@Payload() data: AssignPromotionDto) {
    return this.promotionsService.assignToUser(data);
  }

  @MessagePattern('PROMO_CANCEL_USER_BONUS')
  cancelUserBonus(
    @Payload() data: { userPromotionId: string; performedBy: string },
  ) {
    return this.promotionsService.cancelUserBonus(
      data.userPromotionId,
      data.performedBy,
    );
  }

  @MessagePattern('PROMO_ADMIN_USER_BONUSES')
  adminGetUserBonuses(@Payload() userId: string) {
    return this.promotionsService.adminGetUserBonuses(userId);
  }

  @MessagePattern('PROMO_AUDIT_LOG')
  getAuditLog(
    @Payload() data: { promotionId?: string; userId?: string },
  ) {
    return this.promotionsService.getAuditLog(data.promotionId, data.userId);
  }

  // ── USER: activate an assigned bonus ─────────────
  @MessagePattern('PROMO_ACTIVATE')
  activate(@Payload() data: ActivateBonusDto) {
    return this.promotionsService.activate(data);
  }

  // ── USER: redeem a promo code ─────────────────────
  @MessagePattern('PROMO_REDEEM_CODE')
  redeem(@Payload() data: RedeemPromoCodeDto) {
    return this.promotionsService.redeemCode(data);
  }

  // ── USER: list my bonuses ─────────────────────────
  @MessagePattern('PROMO_MY_BONUSES')
  myBonuses(@Payload() userId: string) {
    return this.promotionsService.getUserBonuses(userId);
  }

  // ── EVENTS: bet settled → advance wagering ────────
  @EventPattern('BET_SETTLED')
  onBetSettled(@Payload() evt: BetSettledEventDto) {
    return this.wageringService.applyBet(evt);
  }

  // ── EVENTS: key player action → auto-grant promos ─
  @EventPattern('PROMO_TRIGGER')
  onTrigger(@Payload() evt: PromoTriggerEventDto) {
    return this.promotionsService.handleTriggerEvent(evt);
  }

  // ── INTERNAL: cron calls this to expire bonuses ───
  @MessagePattern('PROMO_EXPIRE_STALE')
  expireStale() {
    return this.wageringService.expireStale();
  }
}
