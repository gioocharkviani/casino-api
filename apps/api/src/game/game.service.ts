import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserService } from '../user/user.service';
import { UserEntity } from 'libs/database/entities/user.entity';

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

  //------------------GET ALL FAVORITE GAME
  async getAllfavorite(token: string) {
    const user = await this.UserService.getUserInfo(token);
    const res = await lastValueFrom(
      this.client.send('GET_FAVORITE_GAME', user),
    );
    return await res;
  }
  //------------------GET ALL FAVORITE GAME

  //------------------ADD OR REMOVE FAVORITE GAME
  async toggleFavGame({ token, gameId }: { token: string; gameId: string }) {
    const userReq = await this.UserService.getUserInfo(token);
    const res = await lastValueFrom(
      this.client.send('TOGGLE_FAVORITE_GAME', {
        playerId: userReq.id,
        gameId,
      }),
    );
    return res;
  }
  //------------------ADD OR REMOVE FAVORITE GAME

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

  //------------------REFRESH NUXGAME PROVIDER GAME LIST
  async refreshNuxgameProvider() {
    try {
      return await lastValueFrom(
        this.client.send('REFRESH_NUXGAME_PROVIDER', {}),
      );
    } catch (err: any) {
      // Errors thrown as RpcException in the microservice arrive here as a
      // plain object, not an HttpException — if left uncaught, Nest's
      // default filter flattens it to a generic 500 with no detail. Return
      // the real message/upstream body instead so it's actually readable.
      return {
        code: 502,
        status: 'error',
        message: err?.message ?? 'NuxGame refresh failed',
        upstream: err?.upstream ?? err,
      };
    }
  }
  //------------------END REFRESH NUXGAME PROVIDER GAME LIST

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
