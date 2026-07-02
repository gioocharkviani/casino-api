import { Controller } from '@nestjs/common';
import { RevolverService } from './revolver.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Controller()
export class RevolverController {
  constructor(
    private readonly revolverService: RevolverService,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern('REFRESH_PROVIDER')
  refreshPovider() {
    const providerUrl = this.configService.get('REVOLVER_URL');
    const operator = this.configService.get('REVOLVER_OPERATOR');
    const apiKey = this.configService.get('REVOLVER_HASH');
    const requestUrl = `${providerUrl}/getGamesList?operator=${operator}&hash=${apiKey}`;
    return this.revolverService.refreshProvider(requestUrl);
  }

  @MessagePattern('REVOLVER_GET_DEMO_URL')
  getDemoUrl(@Payload() data: { gameId: string; lang?: string }) {
    return { url: this.revolverService.getDemoUrl(data.gameId, data.lang) };
  }

  @MessagePattern('REVOLVER_GRANT_FREE_SPINS')
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
    return this.revolverService.grantFreeSpins(params);
  }
}
