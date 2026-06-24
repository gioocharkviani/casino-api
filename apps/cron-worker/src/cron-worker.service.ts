import { Injectable } from '@nestjs/common';

@Injectable()
export class CronWorkerService {
  getHello(): string {
    return 'Hello World!';
  }
}
