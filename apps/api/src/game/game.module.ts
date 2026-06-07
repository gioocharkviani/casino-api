import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: `GAME_M_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3039 },
      },
    ]),
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
