import { Global, Module } from '@nestjs/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'PROMOTION_MS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3038,
        },
      },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class PromotionModule {}
