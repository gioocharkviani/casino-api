import { Controller, Get, Post } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

@Controller('promotion')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('create')
  createNewPromotion() {
    return this.promotionsService.createNewPromotion();
  }
}
