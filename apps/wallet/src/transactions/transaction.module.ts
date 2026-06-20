import { Module } from '@nestjs/common';
import { transactionService } from './transaction.service';
import { PaymentService } from '../payment/payment.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3035 },
      },
    ]),
  ],
  providers: [transactionService],
  exports: [transactionService],
})
export class transactionModule {}
