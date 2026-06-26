import { Global, Module } from '@nestjs/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PromotionsGatewayModule } from '../promotions/promotions.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'USER_MS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3035,
        },
      },
    ]),
    PromotionsGatewayModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
