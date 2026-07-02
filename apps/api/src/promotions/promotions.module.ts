import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PromotionsGatewayController } from './promotions.controller';
import { PromotionsGatewayService } from './promotions.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'PROMO_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('PROMOTIONS_MS_HOST', 'localhost'), port: 3038 },
        }),
      },
    ]),
  ],
  controllers: [PromotionsGatewayController],
  providers: [PromotionsGatewayService],
  exports: [PromotionsGatewayService],
})
export class PromotionsGatewayModule {}
