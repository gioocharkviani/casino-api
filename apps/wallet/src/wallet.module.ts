import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { transactionModule } from './transactions/transaction.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    transactionModule,
    ClientsModule.register([
      {
        name: `GAME_M_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3030 },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
