import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PromotionEntity } from 'libs/database/entities/promotions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PromotionsService {
  //CREATE NEW PROMOTION
  createNewPromotion() {
    return 'new promotion created';
  }
  //CREATE NEW PROMOTION
}
