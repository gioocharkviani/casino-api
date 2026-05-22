import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GameService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    private readonly authService: AuthService,
  ) {}

  //------------------GET ALL GAMES
  async getAllGames(filters?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    provider?: string;
  }) {
    const result = await lastValueFrom(
      this.client.send('GET_ALL_GAME', {
        page: filters?.page,
        limit: filters?.limit,
        isActive: filters?.isActive,
        search: filters?.search,
        provider: filters?.provider,
      }),
    );

    return result;
  }
  //------------------END GET ALL GAMES

  //------------------REFRESH PROVIDER GAME LIST
  async refreshProvider() {
    const res = await lastValueFrom(this.client.send('REFRESH_PROVIDER', {}));
    return await res;
  }
  //------------------END REFRESH PROVIDER GAME LIST

  //-----------------Lunch game
  async lunchGame(data: LaunchGameDto, token: string) {
    const user = await this.authService.getUserInfo(token);
    const res = await lastValueFrom(
      this.client.send('LUNCH_GAME', { data, user }),
    );

    return res;
  }
  //-----------------Lunch game
}
