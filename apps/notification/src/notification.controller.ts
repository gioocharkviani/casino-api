import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { verifyDto, verifyDtoNotification } from 'libs/common';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  //USER VERIFICATION
  @MessagePattern('SEND_VERIFICATION_REQUEST')
  verification(data: verifyDtoNotification) {
    return this.notificationService.verifiation(data);
  }
  //END USER VERIFICATION
}
