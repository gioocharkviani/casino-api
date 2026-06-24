import { Controller, Get } from '@nestjs/common';
import { CronWorkerService } from './cron-worker.service';

@Controller()
export class CronWorkerController {
  constructor(private readonly cronWorkerService: CronWorkerService) {}

  @Get()
  getHello(): string {
    return this.cronWorkerService.getHello();
  }
}
