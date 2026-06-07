import { Controller, Get } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotion')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  getUserPromotion(): string {
    return this.promotionsService.getHello();
  }
}
