import { Controller, Get, Post } from '@nestjs/common';
import { GameService } from './game.service';
import { ConfigService } from '@nestjs/config';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getAllGame() {
    return this.gameService.getAllGames();
  }

  @Post('revolver-refresh')
  refreshProvider() {
    const providerUrl = this.configService.get('REVOLVER_URL');
    const operator = this.configService.get('REVOLVER_OPERATOR');
    const apiKey = this.configService.get('REVOLVER_HASH');
    const requestUrl = `${providerUrl}/getGamesList?operator=${operator}&hash=${apiKey}`;
    return this.gameService.refreshProvider(requestUrl);
  }
}
