import { Controller } from '@nestjs/common';
import { NuxgameService } from './nuxgame.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller()
export class NuxgameController {
  constructor(
    private readonly nuxgameService: NuxgameService,
    private readonly configService: ConfigService,
  ) {}

  // TODO: confirm real NuxGame "games list" endpoint + query params.
  @MessagePattern('REFRESH_NUXGAME_PROVIDER')
  refreshProvider() {
    const providerUrl = this.configService.get('NUXGAME_URL');
    const operator = this.configService.get('NUXGAME_OPERATOR');
    const apiKey = this.configService.get('NUXGAME_HASH');
    const requestUrl = `${providerUrl}/getGamesList?operator=${operator}&hash=${apiKey}`;
    return this.nuxgameService.refreshProvider(requestUrl);
  }

  @MessagePattern('NUXGAME_GET_DEMO_URL')
  getDemoUrl(@Payload() data: { gameId: string; lang?: string }) {
    return { url: this.nuxgameService.getDemoUrl(data.gameId, data.lang) };
  }

  @MessagePattern('NUXGAME_GRANT_FREE_SPINS')
  grantFreeSpins(
    @Payload()
    params: {
      playerId: string;
      game: string;
      numberOfFreeSpins: number;
      betAmountPerFreeSpin: number;
      currency: string;
      expiresAt: string;
      transactionId: string;
    },
  ) {
    return this.nuxgameService.grantFreeSpins(params);
  }
}
