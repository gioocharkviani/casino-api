import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'PROMOTION_MS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.TCP,
          options: { host: cfg.get('PROMOTIONS_MS_HOST', 'localhost'), port: 3038, retryAttempts: 10, retryDelay: 3000 },
        }),
      },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PromotionModule {}
