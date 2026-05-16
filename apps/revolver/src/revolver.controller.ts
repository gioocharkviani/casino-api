import { Controller } from '@nestjs/common';
import { RevolverService } from './revolver.service';
import { MessagePattern } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import type { GameFilters } from './interface/filters.interface';

@Controller()
export class RevolverController {
  constructor(
    private readonly revolverService: RevolverService,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern('GET_ALL_GAME')
  getAllGames(data: GameFilters) {
    return this.revolverService.getAllGames(data);
  }

  @MessagePattern('REFRESH_PROVIDER')
  refreshPovider() {
    const providerUrl = this.configService.get('REVOLVER_URL');
    const operator = this.configService.get('REVOLVER_OPERATOR');
    const apiKey = this.configService.get('REVOLVER_HASH');
    const requestUrl = `${providerUrl}/getGamesList?operator=${operator}&hash=${apiKey}`;
    return this.revolverService.refreshProvider(requestUrl);
  }
}
