import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { getRequestDto } from './dto/getRequest.dto';
import { LaunchGameDto } from './dto/LunchGame.dto';
import { AuthGuard } from 'libs/guards/auth.guard';
// import { AuthGuard } from 'libs/guards/auth.guard';
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
  @UseGuards(AuthGuard)
  lunchGame(@Query() query: LaunchGameDto) {
    return this.gameService.lunchGame(query);
  }
}
