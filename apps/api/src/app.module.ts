import { Module } from '@nestjs/common';
import { GameModule } from './game/game.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: `REVOLVER_SERVICE`,
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3030 },
      },
    ]),
    ConfigModule.forRoot(),
    GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
