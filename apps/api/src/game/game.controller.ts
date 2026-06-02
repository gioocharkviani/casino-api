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
    const session_token = req.cookies?.session_token
      ? req.cookies?.session_token
      : '';
    return this.gameService.lunchGame(query, session_token);
  }
}
