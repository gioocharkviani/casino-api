import { Module } from '@nestjs/common';
import { transactionService } from './transaction.service';

@Module({
  providers: [transactionService],
  exports: [transactionService],
})
export class transactionModule {}
