import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { MessagePattern } from '@nestjs/microservices';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserEntity } from 'libs/database/entities/user.entity';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @MessagePattern('GET_ALL_GAME')
  getAllGames(data: getRequestDto) {
    return this.gameService.getAllGames(data);
  }

  @MessagePattern('LUNCH_GAME')
  lunchGame({ data, user }: { data: LaunchGameDto; user: UserEntity }) {
    return this.gameService.lunchGame(data, user);
  }
}
