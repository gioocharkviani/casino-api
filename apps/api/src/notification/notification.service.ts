import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { verifyDtoNotification } from 'libs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class notificationService {
  constructor(@Inject('NOTIFICATION_MS_SERVICE') private client: ClientProxy) {}

  //SEND VERIFICATION WITH EMAIL
  async sendVerify(data: verifyDtoNotification) {
    const res = await lastValueFrom(
      this.client.send('SEND_VERIFICATION_REQUEST', data),
    );
    return res;
  }
  //SEND VERIFICATION WITH EMAIL
}
