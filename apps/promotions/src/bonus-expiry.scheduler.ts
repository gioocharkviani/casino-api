import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WageringProgressService } from './wagering-progress.service';

@Injectable()
export class BonusExpiryScheduler {
  private readonly logger = new Logger(BonusExpiryScheduler.name);

  constructor(private readonly wageringService: WageringProgressService) {}

  // runs every hour on the hour
  @Cron('0 * * * *')
  async handleExpiry() {
    const expired = await this.wageringService.expireStale();
    if (expired > 0) {
      this.logger.log(`Expired ${expired} stale bonus(es)`);
    }
  }
}
