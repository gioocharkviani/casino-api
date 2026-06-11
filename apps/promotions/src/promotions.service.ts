import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PromotionEntity } from 'libs/database/entities/promotions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(PromotionEntity)
    private readonly promotionRepository: Repository<PromotionEntity>,
  ) {}

  //CREATE NEW PROMOTION
  createNewPromotion() {
    return 'new promotion created';
  }
  //CREATE NEW PROMOTION
}
