import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
