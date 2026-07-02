import { Controller } from '@nestjs/common';
import { CronWorkerService } from './cron-worker.service';

@Controller()
export class CronWorkerController {
  constructor(private readonly cronWorkerService: CronWorkerService) {}
}
