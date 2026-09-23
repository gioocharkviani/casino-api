import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Game,
  GameProvider,
  GameSession,
  MetaData,
} from 'libs/database/entities/game.entity';
import { UserEntity } from 'libs/database/entities/user.entity';
import { Repository } from 'typeorm';
import { gameMetaData } from '../interface/metaData.interface';
import { GameInterface } from '../interface/game.interface';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { RpcException } from '@nestjs/microservices';

// ── Real NuxGame API shapes (per apidoc.fungamess.games/nuxgame-aggregation) ──
export interface NuxgameProvider {
  id: number;
  name: string;
  logo: string;
  category: number; // 1 = casino, 2 = sport
  slider_image: string | null;
  colored_logo: string | null;
}

export interface NuxgameGame {
  id: number;
  name: string;
  basicRTP: string;
  providerId: number;
  type: string;
  bonus_buy: boolean;
  bonus_risk: boolean;
  supports_fsb: boolean;
  category_icon: string | null;
  category: string;
  typeId: number;
  img: string;
  img_vertical: string;
  img_provider: string;
  img_square?: string;
  game_background?: string;
  demo: boolean;
  device: string;
  release_date: string | null;
  lowRTP?: string;
}

@Injectable()
export class NuxgameService {
  private readonly logger = new Logger(NuxgameService.name);
  private readonly GAME_UUID_PREFIX = 'nuxg-';

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(GameProvider)
    private readonly providerRepository: Repository<GameProvider>,
    @InjectRepository(MetaData)
    private readonly metaDataRepository: Repository<MetaData>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly configService: ConfigService,
  ) {}

  private baseUrl(): string {
    const url = this.configService.get<string>('NUXGAME_URL', '');
    if (!url) {
      throw new RpcException({
        status: 'error',
        message: 'NUXGAME_URL is not configured in .env',
      });
    }
    return url.replace(/\/+$/, '');
  }

  // ── Hash-Authorization signing ─────────────────────

  private signParams(params: Record<string, any>): string {
    const secret = this.configService.get<string>('NUXGAME_HASH', '');
    const sorted: Record<string, string> = {};
    for (const key of Object.keys(params).sort()) {
      if (params[key] === undefined || params[key] === null) continue;
      sorted[key] = String(params[key]);
    }
    const json = JSON.stringify(sorted);
    return crypto
      .createHash('sha256')
      .update(json + secret)
      .digest('hex');
  }

  private preview(body: any, max = 2000): string {
    const str = typeof body === 'string' ? body : JSON.stringify(body);
    if (!str) return String(str);
    return str.length > max
      ? `${str.slice(0, max)}… [truncated, ${str.length} chars total]`
      : str;
  }

  private async signedFetch(
    path: string,
    query: Record<string, any> = {},
    init: RequestInit = {},
  ): Promise<any> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    }
    // Docs: a trailing "/" after the method name is required.
    const url = `${this.baseUrl()}${path}/${qs.toString() ? `?${qs.toString()}` : ''}`;
    const hash = this.signParams(query);

    this.logger.log(
      `→ NuxGame request: GET ${url} | query=${JSON.stringify(query)} | Hash-Authorization=${hash}`,
    );

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Hash-Authorization': hash,
          ...(init.headers ?? {}),
        },
      });
    } catch (err: any) {
      this.logger.error(
        `✗ NuxGame request to ${url} threw before a response arrived: ${err.message}`,
        err?.stack,
      );
      throw new RpcException({
        status: 'error',
        message: `NuxGame request failed (network error): ${err.message}`,
      });
    }

    const durationMs = Date.now() - startedAt;
    const text = await response.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    this.logger.log(
      `← NuxGame response: ${response.status} ${response.statusText} for ${path} (${durationMs}ms) | body=${this.preview(body)}`,
    );

    if (!response.ok) {
      this.logger.error(
        `✗ NuxGame ${path} failed [${response.status}]: ${this.preview(body)}`,
      );
      throw new RpcException({
        status: 'error',
        message: `NuxGame ${path} failed (HTTP ${response.status})`,
        upstream: body,
      });
    }

    return body;
  }

  // Raw preview — fetches NuxGame's providers + game list and returns them
  // as-is, with no DB writes. Lets an admin see exactly what the provider
  // sent back before/without running an actual sync.
  async fetchRawGameList(): Promise<{
    providerCount: number;
    gameCount: number;
    providers: NuxgameProvider[];
    games: NuxgameGame[];
  }> {
    const providers: NuxgameProvider[] =
      (await this.signedFetch('/providersList')) ?? [];
    const res = await this.signedFetch('/gameList');
    const games: NuxgameGame[] = res?.games ?? [];
    return {
      providerCount: providers.length,
      gameCount: games.length,
      providers,
      games,
    };
  }

  // ── REFRESH GAME LIST (providers + games) ──────────
  async refreshProvider(): Promise<{
    status: string;
    newGames: number;
    updatedGames: number;
    message: string;
  }> {
    this.logger.log('=== NuxGame refreshProvider() started ===');
    let providers: NuxgameProvider[];
    let games: NuxgameGame[];

    try {
      providers = (await this.signedFetch('/providersList')) ?? [];
      this.logger.log(
        `Fetched ${providers.length} providers from /providersList`,
      );
    } catch (err) {
      this.rethrowReadable('fetching /providersList', err);
    }

    try {
      const res = await this.signedFetch('/gameList');
      games = res?.games ?? [];
      this.logger.log(`Fetched ${games.length} games from /gameList`);
    } catch (err) {
      this.rethrowReadable('fetching /gameList', err);
    }

    const providerById = new Map<number, NuxgameProvider>();
    for (const p of providers!) providerById.set(p.id, p);

    let unmatchedProviderIds = 0;
    let missingThumbnail = 0;

    const mapped: GameInterface[] = games!.map((g) => {
      const provider = providerById.get(g.providerId);
      if (!provider) unmatchedProviderIds++;
      const thumbnail = g.img
        ? g.img
        : 'https://stage.nuxgame.com/images/nothing.jpeg';
      if (!thumbnail) missingThumbnail++;
      return {
        gameUUID: `${this.GAME_UUID_PREFIX}${g.id}`,
        gameHumanReadableId: String(g.id),
        gameName: g.name,
        description: null,
        rules: null,
        status: 1,
        gameProviderName: provider?.name ?? `NuxGame Provider ${g.providerId}`,
        gameProviderPrefix: `nuxg-${g.providerId}`,
        thumbnail,
        marketingMaterialsZip: '',
        metaData: {
          supports_promo_freespins: g.supports_fsb,
        } as gameMetaData,
      };
    });

    this.logger.log(
      `Mapped ${mapped.length} games | ${unmatchedProviderIds} had no matching provider in /providersList | ${missingThumbnail} had no thumbnail URL at all`,
    );
    if (mapped[0]) {
      this.logger.log(`Sample mapped game: ${this.preview(mapped[0])}`);
    }

    try {
      const result = await this.processAndSaveGames(mapped);
      this.logger.log(
        `=== NuxGame refreshProvider() finished: ${this.preview(result)} ===`,
      );
      return result;
    } catch (err) {
      this.rethrowReadable('saving NuxGame games to DB', err);
    }
  }

  private rethrowReadable(step: string, err: any): never {
    if (err instanceof RpcException) throw err;
    const message = err?.message ?? String(err);
    this.logger.error(
      `NuxGame refresh failed while ${step}: ${message}`,
      err?.stack,
    );
    throw new RpcException({
      status: 'error',
      message: `NuxGame refresh failed while ${step}: ${message}`,
    });
  }

  // ── LAUNCH GAME (real money / demo) ────────────────
  async lunchNuxgameGame(data: LaunchGameDto, user: UserEntity) {
    const country = await this.resolveCountryCode(user.id);
    const gameId = this.stripPrefix(data.gameId);
    const isDemo = data.demo === '1' || data.demo === 'true';
    const uuid = randomUUID().replace(/-/g, '');
    const token = isDemo ? undefined : uuid;

    const query: Record<string, any> = {
      demo: isDemo,
      gameId,
      country,
      lang: data.lang || 'en',
      mobile: data.variant === 'mobile',
    };
    if (data.exitUrl) query.exiturl = data.exitUrl;
    if (!isDemo) {
      query.userId = user.id;
      query.token = token;
    }

    if (!isDemo) {
      await this.createGameSession({
        token: token!,
        gameId,
        playerId: user.id,
        isActive: true,
      } as GameSession);
    }

    // /start responds 302 with the game URL in Location (200 HTML for a
    // handful of providers) — follow manually so we can hand the URL back
    // to the frontend instead of letting fetch silently follow it.
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) qs.set(k, String(v));
    const url = `${this.baseUrl()}/start/?${qs.toString()}`;
    const hash = this.signParams(query);

    this.logger.log(
      `→ NuxGame launch request: GET ${url} | isDemo=${isDemo} | userId=${isDemo ? 'n/a' : user.id} | Hash-Authorization=${hash}`,
    );

    const startedAt = Date.now();
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Hash-Authorization': hash,
      },
    });
    const durationMs = Date.now() - startedAt;

    this.logger.log(
      `← NuxGame launch response: ${res.status} ${res.statusText} (${durationMs}ms) | Location=${res.headers.get('location') ?? 'n/a'}`,
    );

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (!location) {
        this.logger.error(
          '✗ NuxGame /start returned a redirect with no Location header',
        );
        throw new RpcException({
          status: 'error',
          message: 'NuxGame /start returned a redirect with no Location header',
        });
      }
      return { code: 200, lunch_game_url: location };
    }

    const text = await res.text();
    this.logger.log(`NuxGame /start body: ${this.preview(text)}`);
    if (!res.ok) {
      this.logger.error(`NuxGame /start failed [${res.status}]: ${text}`);
      throw new RpcException({
        status: 'error',
        message: `NuxGame launch failed (HTTP ${res.status}): ${text}`,
      });
    }
    // 200 HTML case (TVBet / Tom Horn / PGSoftZen) — hand the URL itself
    // back since there's no redirect to extract.
    return { code: 200, lunch_game_url: url };
  }

  private stripPrefix(gameId: string): string {
    return gameId.startsWith(this.GAME_UUID_PREFIX)
      ? gameId.slice(this.GAME_UUID_PREFIX.length)
      : gameId;
  }

  private async resolveCountryCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { country: true },
    });
    return user?.country?.countryCode ?? 'US';
  }

  // ── DEMO LAUNCH URL ─────────────────────────────────
  async getDemoUrl(gameId: string, lang = 'en'): Promise<string> {
    const query = {
      demo: true,
      gameId: this.stripPrefix(gameId),
      country: 'US',
      lang,
    };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) qs.set(k, String(v));
    // Returned directly for the frontend to open — NuxGame resolves the
    // redirect itself when the browser follows this link.
    const url = `${this.baseUrl()}/start/?${qs.toString()}`;
    this.logger.log(`Built NuxGame demo URL for gameId=${gameId}: ${url}`);
    return url;
  }

  // ── FREE SPINS API (POST /activateFsb) ─────────────
  async grantFreeSpins(params: {
    playerId: string;
    game: string;
    numberOfFreeSpins: number;
    betAmountPerFreeSpin: number;
    currency: string;
    expiresAt: string;
    transactionId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await this.gameSessionRepository.findOne({
        where: { playerId: params.playerId, isActive: true },
      });
      if (!session?.token) {
        return {
          success: false,
          error:
            'No active NuxGame session — player must have an open session/token to activate free spins',
        };
      }

      const country = await this.resolveCountryCode(params.playerId);
      const now = new Date();

      const body = {
        userId: params.playerId,
        country,
        deviceType: 'desktop' as const,
        token: session.token,
        gameId: this.stripPrefix(params.game),
        bonus: {
          bonusName: `promo-${params.transactionId}`,
          bonusRounds: String(params.numberOfFreeSpins),
          bonusBet: String(params.betAmountPerFreeSpin / 100),
          bonusExpired: params.expiresAt,
          bonusStart: now.toISOString(),
        },
      };

      this.logger.log(
        `→ NuxGame free spins request: POST /activateFsb | body=${this.preview(body)}`,
      );

      const res = await fetch(`${this.baseUrl()}/activateFsb/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Hash-Authorization': this.signParams(body as any),
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      this.logger.log(
        `← NuxGame free spins response: ${res.status} | body=${this.preview(json)}`,
      );

      if (!res.ok || json?.status === false) {
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
      this.logger.error(
        `NuxGame free spins network error: ${err.message}`,
        err?.stack,
      );
      return { success: false, error: err.message };
    }
  }

  ///////////////===================================/////////////////
  private async processAndSaveGames(gameData: GameInterface[]) {
    const countBefore = await this.gameRepository.count();
    let updatedGames = 0;
    for (const game of gameData) {
      try {
        const result = await this.findOrCreateGame(game);
        if ((result as any)?.updated) updatedGames++;
      } catch (error: any) {
        this.logger.warn(
          `Error processing game ${game?.gameName}: ${error?.message}`,
        );
        continue;
      }
    }
    const countAfter = await this.gameRepository.count();
    return {
      status: 'OK',
      newGames: countAfter - countBefore,
      updatedGames,
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
      relations: { metaData: true, gameProvider: true },
    });

    if (FIND_GAME) {
      return this.updateExistingGame(FIND_GAME, DATA);
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

  // Duplicate hit on sync — refresh the row from the provider's current
  // data instead of leaving it stale. gameName/thumbnail/description/rules/
  // status/marketingMaterialsZip and the provider link all get overwritten
  // with whatever NuxGame sent this time; only gameUUID (the identity we
  // matched on) and the row's own id are left untouched.
  private async updateExistingGame(existing: Game, DATA: GameInterface) {
    let changed = false;

    if (DATA.thumbnail && DATA.thumbnail !== existing.thumbnail) {
      existing.thumbnail = DATA.thumbnail;
      changed = true;
    }
    if (DATA.gameName && DATA.gameName !== existing.gameName) {
      existing.gameName = DATA.gameName;
      changed = true;
    }
    if (DATA.description !== existing.description) {
      existing.description = DATA.description;
      changed = true;
    }
    if (DATA.rules !== existing.rules) {
      existing.rules = DATA.rules;
      changed = true;
    }
    if (DATA.status !== undefined && DATA.status !== existing.status) {
      existing.status = DATA.status;
      changed = true;
    }
    if (
      DATA.marketingMaterialsZip &&
      DATA.marketingMaterialsZip !== existing.marketingMaterialsZip
    ) {
      existing.marketingMaterialsZip = DATA.marketingMaterialsZip;
      changed = true;
    }
    if (
      DATA.gameProviderPrefix &&
      existing.gameProvider?.prefix !== DATA.gameProviderPrefix
    ) {
      const provider = await this.findOrCreateProvider({
        name: DATA.gameProviderName,
        prefix: DATA.gameProviderPrefix,
      });
      existing.providerId = provider.id;
      changed = true;
    }

    if (DATA.metaData) {
      const hasValues = Object.values(DATA.metaData).some(
        (v) => v !== null && v !== undefined && v !== '',
      );
      if (hasValues) {
        if (existing.metaData) {
          Object.assign(existing.metaData, DATA.metaData);
          await this.metaDataRepository.save(existing.metaData);
        } else {
          existing.metaData = await this.findOrCreateMetaData(DATA.metaData);
        }
        changed = true;
      }
    }

    if (changed) {
      await this.gameRepository.save(existing);
    }

    return {
      status: 'OK',
      updated: changed,
      message: changed
        ? 'Existing game updated from provider data'
        : 'Game already up to date',
      gameId: existing.id,
    };
  }

  private async findOrCreateProvider(provider: {
    name: string;
    prefix: string;
  }) {
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
      this.logger.warn('Metadata creation error');
      return null;
    }
  }
}
