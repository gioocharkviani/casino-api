import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { MessagePattern } from '@nestjs/microservices';
import type { FilterInterface } from './interface/filters.interface';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @MessagePattern('GET_ALL_GAME')
  getAllGames(data: FilterInterface) {
    return this.gameService.getAllGames(data);
  }

  @MessagePattern('LUNCH_GAME')
  lunchGame(data: any) {
    return this.gameService.lunchGame(data);
  }
}
