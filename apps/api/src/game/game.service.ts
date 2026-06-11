import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class GameService {
  constructor(
    @Inject('GAME_M_SERVICE') private client: ClientProxy,
    private readonly UserService: UserService,
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

  //------------------GET ALL PROVIDER
  async getAllProvider() {
    const result = await lastValueFrom(
      this.client.send('GET_ALL_PROVIDER', {}),
    );

    return result;
  }
  //------------------END GET ALL PROVIDER

  //------------------ GET ALL GAMES BY CATEGORIES
  async getGamesByCategoies() {
    const res = await lastValueFrom(
      this.client.send('GET_CATEGORIES_GAME', {}),
    );
    return await res;
  }
  //------------------ END GET ALL GAMES BY CATEGORIES

  //------------------REFRESH PROVIDER GAME LIST
  async refreshProvider() {
    const res = await lastValueFrom(this.client.send('REFRESH_PROVIDER', {}));
    return await res;
  }
  //------------------END REFRESH PROVIDER GAME LIST

  //-----------------Lunch game
  async lunchGame(data: LaunchGameDto, token: string) {
    const user = await this.UserService.getUserInfo(token);
    const res = await lastValueFrom(
      this.client.send('LUNCH_GAME', { data, user }),
    );

    return res;
  }
  //-----------------Lunch game
}
