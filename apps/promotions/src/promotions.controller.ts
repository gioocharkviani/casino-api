import { Controller, Get, Post } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { promotionEventListenerDto } from 'libs/common';

@Controller()
export class PromotionsController {
  constructor() {}

  //when evnet create listen that event
  @EventPattern('EVENT_CREATED')
  eventListening(@Payload() data: promotionEventListenerDto) {}
  //when evnet create listen that event

  //ADMIN CREATE BONUS
  //ADMIN CHANGE BONUS TYPES STATUS AND ALL INFORMATION
  //ADMIN GRANT MANUAL BONUS TO USER\
  //ADMIN DELETE BONUS
  //ADMIN CREATE BONUSE RULE
}
