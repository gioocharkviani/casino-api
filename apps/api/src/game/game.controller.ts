import { Controller, Get, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { ConfigService } from '@nestjs/config';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getAllGame() {
    return this.gameService.getAllGames();
  }

  @Post('revolver-refresh')
  refreshProvider() {
    return this.gameService.refreshProvider();
  }
}
