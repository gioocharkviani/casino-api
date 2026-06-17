import { Body, Controller, Post, Req } from '@nestjs/common';
import { notificationService } from './notification.service';
import { verifyDtoNotification } from 'libs/common';
import type { Request } from 'express';

@Controller('notification')
export class notificationController {
  constructor(private readonly notificationService: notificationService) {}

  //SEND VERIFICATION EMAIL
  @Post('verify-user')
  sendVerify(@Req() req: Request, @Body() body: verifyDtoNotification) {
    return this.notificationService.sendVerify(body);
  }
  //SEND VERIFICATION EMAIL
}
