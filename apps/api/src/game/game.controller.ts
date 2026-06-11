import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { GameService } from './game.service';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { AuthGuard } from 'libs/guards/auth.guard';
import { VerifyGuard } from 'libs/guards/verify.guard';
import type { Request } from 'express';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getAllGame(@Query() query: getRequestDto) {
    return this.gameService.getAllGames(query);
  }
  @Get('provider')
  getAllProvider() {
    return this.gameService.getAllProvider();
  }

  @Get('/categories')
  getGamesByCategories() {
    return this.gameService.getGamesByCategoies();
  }

  @Post('revolver-refresh')
  refreshProvider() {
    return this.gameService.refreshProvider();
  }

  @Get('lunch-game')
  @UseGuards(AuthGuard, VerifyGuard)
  lunchGame(@Query() query: LaunchGameDto, @Req() req: Request) {
    const header = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : '';
    return this.gameService.lunchGame(query, token);
  }
}
