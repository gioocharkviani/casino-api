import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ActivateBonusDto, ChooseGameDto, RedeemPromoCodeDto } from 'libs/common/dto/promotion.dto';

@Injectable()
export class PromotionsGatewayService {
  constructor(
    @Inject('PROMO_MS_SERVICE')
    private readonly promoClient: ClientProxy,
  ) {}

  activateBonus(dto: ActivateBonusDto) {
    return lastValueFrom(this.promoClient.send('PROMO_ACTIVATE', dto));
  }

  redeemCode(dto: RedeemPromoCodeDto) {
    return lastValueFrom(this.promoClient.send('PROMO_REDEEM_CODE', dto));
  }

  getMyBonuses(userId: string) {
    return lastValueFrom(this.promoClient.send('PROMO_MY_BONUSES', userId));
  }

  chooseGame(dto: ChooseGameDto) {
    return lastValueFrom(this.promoClient.send('PROMO_CHOOSE_GAME', dto));
  }

  getEligibleGames(userPromotionId: string, userId: string) {
    return lastValueFrom(
      this.promoClient.send('PROMO_ELIGIBLE_GAMES', { userPromotionId, userId }),
    );
  }

  emitBetSettled(userId: string, betAmount: number, gameKey?: string) {
    this.promoClient.emit('BET_SETTLED', { userId, betAmount, gameKey });
  }

  emitTrigger(userId: string, eventType: string, amount?: number) {
    this.promoClient.emit('PROMO_TRIGGER', { userId, eventType, amount });
  }
}
