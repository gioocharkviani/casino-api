import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Game,
  GameProvider,
  GameSession,
  MetaData,
} from 'libs/database/entities/game.entity';
import { Repository } from 'typeorm';
import { gameProvider } from '../interface/provider.interface';
import { gameMetaData } from '../interface/metaData.interface';
import { GameInterface } from '../interface/game.interface';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { RpcException } from '@nestjs/microservices';

/**
 * NuxGame provider adapter. Mirrors RevolverService's structure/contract so
 * GameService.lunchGame / GameController message patterns can dispatch to it
 * the same way. Real request/response shapes below are PLACEHOLDERS —
 * TODO: replace once NuxGame API docs are read (via the nuxgame-aggregation
 * MCP server) or keys/spec are provided.
 */
@Injectable()
export class NuxgameService {
  private readonly logger = new Logger(NuxgameService.name);

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(GameProvider)
    private readonly providerRepository: Repository<GameProvider>,
    @InjectRepository(MetaData)
    private readonly metaDataRepository: Repository<MetaData>,

    private readonly configService: ConfigService,
  ) {}

  // ── REFRESH GAME LIST ──────────────────────────────
  // TODO: confirm real NuxGame "games list" endpoint + response shape.
  async refreshProvider(reqUrl: string) {
    try {
      const response = await fetch(`${reqUrl}`);
      const data = await response.json();
      // PLACEHOLDER: adjust path to wherever NuxGame nests the game array.
      const gameData: GameInterface[] =
        data?.data?.availableGames ?? data?.games ?? [];
      const result = await this.processAndSaveGames(gameData);
      return result;
    } catch (error) {
      throw new HttpException(
        'ERROR DURING NUXGAME REFRESH PROVIDER',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  // ── LAUNCH GAME (real money / demo) ────────────────
  // TODO: confirm real NuxGame launch endpoint, params, and signature scheme.
  async lunchNuxgameGame(data: LaunchGameDto, user: UserEntity) {
    const baseUrl = this.configService.get<string>('NUXGAME_URL', '');
    const OPERATOR = this.configService.get<string>('NUXGAME_OPERATOR', '');
    const GAME_ID = data.gameId;
    const LANG = data.lang || 'en';
    const VARIANT = data.variant || 'desktop';
    const EXIT_URL = data.exitUrl || '';

    const isDemo = data.demo === '1' || data.demo === 'true';
    const uuid = randomUUID().replace(/-/g, '');
    const token = isDemo ? 'XYZ' : uuid;

    // PLACEHOLDER launch URL shape — replace with NuxGame's real launch API.
    const LAUNCH_GAME_URL = `${baseUrl}/launch?operator=${OPERATOR}&exit_url=${EXIT_URL}&game=${GAME_ID}&token=${token}&lang=${LANG}&variant=${VARIANT}&demo=${isDemo}`;

    const request = await fetch(`${LAUNCH_GAME_URL}`);
    const res = await request.json();

    if (!isDemo) {
      await this.createGameSession({
        token,
        gameId: GAME_ID,
        playerId: user.id,
        isActive: true,
      });
    }

    return {
      code: 200,
      lunch_game_url: res?.data?.URL ?? res?.url,
    };
  }

  // ── DEMO LAUNCH URL (no session, no network) ───────
  getDemoUrl(gameId: string, lang = 'en'): string {
    const baseUrl = this.configService.get<string>('NUXGAME_URL', '');
    const operator = this.configService.get<string>('NUXGAME_OPERATOR', '');
    return `${baseUrl}/launch?operator=${operator}&exit_url=&game=${encodeURIComponent(gameId)}&token=XYZ&lang=${lang}&variant=desktop&demo=true`;
  }

  // ── FREE SPINS API ──────────────────────────────────
  // TODO: confirm real NuxGame free-spins/backoffice endpoint + signature formula.
  async grantFreeSpins(params: {
    playerId: string;
    game: string;
    numberOfFreeSpins: number;
    betAmountPerFreeSpin: number;
    currency: string;
    expiresAt: string;
    transactionId: string;
  }): Promise<{ success: boolean; error?: string }> {
    const operator = this.configService
      .get<string>('NUXGAME_OPERATOR', '')
      .trim();
    const baseUrl = this.configService
      .get<string>('NUXGAME_BACKOFFICE_URL', '')
      .trim();
    const secretKey = this.configService.get<string>('NUXGAME_HASH', '').trim();
    const hash = crypto
      .createHash('md5')
      .update(operator + secretKey)
      .digest('hex');

    const body = {
      operator,
      transactionId: params.transactionId,
      playerId: params.playerId,
      brand: operator,
      game: params.game,
      numberOfFreeSpins: params.numberOfFreeSpins,
      betAmountPerFreeSpin: params.betAmountPerFreeSpin,
      expires: params.expiresAt,
      currency: params.currency,
      additionalData: {},
      hash,
    };

    try {
      const res = await fetch(`${baseUrl}/freespins/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        this.logger.warn(
          `NuxGame free spins grant failed [${res.status}] player=${params.playerId} game=${params.game}: ${JSON.stringify(json)}`,
        );
        return { success: false, error: json?.message ?? `HTTP ${res.status}` };
      }

      this.logger.log(
        `NuxGame free spins granted: ${params.numberOfFreeSpins} spins on ${params.game} for player ${params.playerId}`,
      );
      return { success: true };
    } catch (err: any) {
      this.logger.error(`NuxGame free spins network error: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  ///////////////===================================/////////////////
  private async processAndSaveGames(gameData: GameInterface[]) {
    let processed = 0;
    const countBefore = await this.gameRepository.count();
    for (const game of gameData) {
      try {
        await this.findOrCreateGame(game);
        processed++;
      } catch (error) {
        console.error(`Error processing game ${game?.gameName}:`);
        continue;
      }
    }
    const countAfter = await this.gameRepository.count();
    return {
      status: 'OK',
      newGames: countAfter - countBefore,
      message: 'PROVIDER REFRESH SUCCESSFULLY',
    };
  }

  private async createGameSession(data: GameSession) {
    const playerId = data.playerId;
    try {
      const findActiveSession = await this.gameSessionRepository.findOne({
        where: { playerId, isActive: true },
      });
      if (findActiveSession) {
        findActiveSession.isActive = false;
        findActiveSession.token = null;
        await this.gameSessionRepository.save(findActiveSession);
      }
      const session = this.gameSessionRepository.create(data);
      return await this.gameSessionRepository.save(session);
    } catch (error) {
      throw new RpcException('ERROR DURING CREATING GAME SESSION');
    }
  }

  private async findOrCreateGame(DATA: GameInterface) {
    const FIND_GAME = await this.gameRepository.findOne({
      where: { gameUUID: DATA.gameUUID },
    });
    if (FIND_GAME) {
      return {
        skipped: true,
        message: 'Game already exists',
        gameId: FIND_GAME.id,
      };
    }

    const PROVIDER = await this.findOrCreateProvider({
      name: DATA.gameProviderName,
      prefix: DATA.gameProviderPrefix,
    });
    const METADATA = await this.findOrCreateMetaData(DATA.metaData);
    const createGame = this.gameRepository.create({
      thumbnail: DATA.thumbnail,
      description: DATA.description,
      gameName: DATA.gameName,
      providerId: PROVIDER.id,
      gameHumanReadableId: DATA.gameHumanReadableId,
      gameUUID: DATA.gameUUID,
      metaData: METADATA,
      marketingMaterialsZip: DATA.marketingMaterialsZip,
      rules: DATA.rules,
      status: DATA.status,
    });
    const savedGames = await this.gameRepository.save(createGame);
    return {
      status: 'OK',
      message: 'NUXGAME provider gamelist updated succesfully',
      newGames: savedGames,
    };
  }

  private async findOrCreateProvider(provider: gameProvider) {
    const _provider = await this.providerRepository.findOne({
      where: { prefix: provider.prefix },
    });
    if (!_provider) {
      const createProvider = this.providerRepository.create({
        name: provider.name,
        prefix: provider.prefix,
      });
      await this.providerRepository.save(createProvider);
      return createProvider;
    }
    return _provider;
  }

  private async findOrCreateMetaData(gameMetadata: gameMetaData) {
    if (!gameMetadata) return null;
    const hasValues = Object.values(gameMetadata).some(
      (value) => value !== null && value !== undefined && value !== '',
    );
    if (!hasValues) return null;

    try {
      const createMetaData = this.metaDataRepository.create(gameMetadata);
      return await this.metaDataRepository.save(createMetaData);
    } catch (error) {
      console.error('Metadata creation error');
      return null;
    }
  }
}
