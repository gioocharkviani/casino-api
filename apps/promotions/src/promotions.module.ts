import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { DatabaseModule } from 'libs/database/database.module';
import { PromotionEngineService } from './services/promotion-engine.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionEngineService],
  exports: [PromotionEngineService],
})
export class PromotionsModule {}
