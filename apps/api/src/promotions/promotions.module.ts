import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PromotionsGatewayController } from './promotions.controller';
import { PromotionsGatewayService } from './promotions.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROMO_MS_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3038 },
      },
    ]),
  ],
  controllers: [PromotionsGatewayController],
  providers: [PromotionsGatewayService],
  exports: [PromotionsGatewayService],
})
export class PromotionsGatewayModule {}
