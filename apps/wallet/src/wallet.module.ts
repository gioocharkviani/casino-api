import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from 'libs/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { transactionModule } from './transactions/transaction.module';
import { WageringService } from 'libs/common/services/wagering.service';
import { UserModule } from 'apps/user/src/user.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ConfigModule,
    transactionModule,
    ClientsModule.register([
      {
        name: `GAME_M_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3039 },
      },
      {
        name: 'USER_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3035 },
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, WageringService],
})
export class WalletModule {}
