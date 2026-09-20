import { Controller } from '@nestjs/common';
import { NuxgameService } from './nuxgame.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class NuxgameController {
  constructor(private readonly nuxgameService: NuxgameService) {}

  @MessagePattern('REFRESH_NUXGAME_PROVIDER')
  refreshProvider() {
    return this.nuxgameService.refreshProvider();
  }

  @MessagePattern('NUXGAME_RAW_GAME_LIST')
  fetchRawGameList() {
    return this.nuxgameService.fetchRawGameList();
  }

  @MessagePattern('NUXGAME_GET_DEMO_URL')
  async getDemoUrl(@Payload() data: { gameId: string; lang?: string }) {
    return { url: await this.nuxgameService.getDemoUrl(data.gameId, data.lang) };
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
