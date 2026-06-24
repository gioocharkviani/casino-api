import { Module } from '@nestjs/common';
import { CronWorkerController } from './cron-worker.controller';
import { CronWorkerService } from './cron-worker.service';

@Module({
  imports: [],
  controllers: [CronWorkerController],
  providers: [CronWorkerService],
})
export class CronWorkerModule {}
