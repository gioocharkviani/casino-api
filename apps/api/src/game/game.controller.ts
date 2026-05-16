import { Controller, Get, Post, Query } from '@nestjs/common';
import { GameService } from './game.service';
import { getRequestDto } from './dto/getRequest.dto';
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
}
