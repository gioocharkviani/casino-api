import { Controller, Get, Post, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { getRequestDto } from './dto/getRequest.dto';
import { LaunchGameDto } from './dto/LunchGame.dto';
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getAllGame(@Query() query: getRequestDto) {
    return this.gameService.getAllGames(query);
  }

  @Post('revolver-refresh')
  refreshProvider() {
    return this.gameService.refreshProvider();
  }

  @Get('lunch-game')
  lunchGame(@Query() query: LaunchGameDto) {
    return this.gameService.lunchGame(query);
  }
}
