import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { PromotionsGatewayModule } from '../promotions/promotions.module';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: `WALLET_M_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3031 },
      },
    ]),
    PromotionsGatewayModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
