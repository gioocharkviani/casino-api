import { Body, Controller, Post } from '@nestjs/common';
import { notificationService } from './notification.service';
import { verifyDtoNotification } from 'libs/common';

@Controller('notification')
export class notificationController {
  constructor(private readonly notificationService: notificationService) {}

  //SEND VERIFICATION EMAIL
  @Post('verify-user')
  sendVerify(@Body() data: verifyDtoNotification) {
    return this.notificationService.sendVerify(data);
  }
  //SEND VERIFICATION EMAIL
}
