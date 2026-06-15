import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { MessagePattern } from '@nestjs/microservices';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { favGameDto } from 'libs/common/dto/favGame.dto';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @MessagePattern('GET_ALL_GAME')
  getAllGames(data: getRequestDto) {
    return this.gameService.getAllGames(data);
  }

  @MessagePattern('GET_ALL_PROVIDER')
  getAllProvider() {
    return this.gameService.getAllProvider();
  }

  @MessagePattern('GET_CATEGORIES_GAME')
  getAllGameByCategories() {
    return this.gameService.getAllGameByCategories();
  }

  @MessagePattern('GET_FAVORITE_GAME')
  getAllfavoriteGame(user: UserEntity) {
    return this.gameService.getAllfavoriteGame(user);
  }
  @MessagePattern('TOGGLE_FAVORITE_GAME')
  toggleFavGame(data: favGameDto) {
    return this.gameService.toggleFavGame(data);
  }

  @MessagePattern('LUNCH_GAME')
  lunchGame({ data, user }: { data: LaunchGameDto; user: UserEntity }) {
    return this.gameService.lunchGame(data, user);
  }

  @MessagePattern('VALIDATE_GAME_SESSION')
  validateGameSession(token: string) {
    return this.gameService.validateGameSession(token);
  }
}
