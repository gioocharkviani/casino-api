import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from 'libs/guards/auth.guard';
import { PromotionsGatewayService } from './promotions.service';
import { RedeemPromoCodeDto } from 'libs/common/dto/promotion.dto';

@Controller('promotions')
export class PromotionsGatewayController {
  constructor(private readonly promoService: PromotionsGatewayService) {}

  // GET /promotions/my-bonuses  — list caller's bonuses
  @Get('my-bonuses')
  @UseGuards(AuthGuard)
  getMyBonuses(@Req() req: Request) {
    return this.promoService.getMyBonuses((req as any).userId);
  }

  // POST /promotions/activate  — activate an assigned bonus
  @Post('activate')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  activate(
    @Req() req: Request,
    @Body() body: { userPromotionId: string },
  ) {
    return this.promoService.activateBonus({
      userId: (req as any).userId,
      userPromotionId: body.userPromotionId,
    });
  }

  // POST /promotions/redeem  — enter a promo code
  @Post('redeem')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  redeem(@Req() req: Request, @Body() body: { code: string }) {
    return this.promoService.redeemCode({
      userId: (req as any).userId,
      code: body.code,
    });
  }
}
