import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from 'libs/guards/auth.guard';
import { PromotionsGatewayService } from './promotions.service';

@Controller('promotions')
export class PromotionsGatewayController {
  constructor(private readonly promoService: PromotionsGatewayService) {}

  // GET /promotions/my-bonuses
  @Get('my-bonuses')
  @UseGuards(AuthGuard)
  getMyBonuses(@Req() req: Request) {
    return this.promoService.getMyBonuses((req as any).userId);
  }

  // GET /promotions/bonuses/:id/eligible-games
  // Returns which games the user can pick for a user-choice free-spin bonus
  @Get('bonuses/:id/eligible-games')
  @UseGuards(AuthGuard)
  getEligibleGames(@Req() req: Request, @Param('id') id: string) {
    return this.promoService.getEligibleGames(id, (req as any).userId);
  }

  // POST /promotions/activate
  @Post('activate')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  activate(@Req() req: Request, @Body() body: { userPromotionId: string }) {
    return this.promoService.activateBonus({
      userId: (req as any).userId,
      userPromotionId: body.userPromotionId,
    });
  }

  // POST /promotions/choose-game
  // User selects a game for their pending free-spin bonus → Revolver API fires here
  @Post('choose-game')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  chooseGame(
    @Req() req: Request,
    @Body() body: { userPromotionId: string; gameUUID: string },
  ) {
    return this.promoService.chooseGame({
      userId: (req as any).userId,
      userPromotionId: body.userPromotionId,
      gameUUID: body.gameUUID,
    });
  }

  // POST /promotions/redeem
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
