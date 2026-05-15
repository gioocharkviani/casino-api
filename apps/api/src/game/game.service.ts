import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';

@Injectable()
export class GameService {
  constructor(
    private readonly configService: ConfigService,
    @Inject('REVOLVER_SERVICE') private client: ClientProxy,
  ) {}

  //------------------GET ALL GAMES
  async getAllGames() {
    const result = await lastValueFrom(this.client.send('GET_ALL_GAME', {}));
    return result;
  }
  //------------------END GET ALL GAMES

  //------------------REFRESH PROVIDER GAME LIST
  async refreshProvider() {
    const res = await lastValueFrom(this.client.send('REFRESH_PROVIDER', {}));
    return await res;
  }
  //------------------END REFRESH PROVIDER GAME LIST
}
