import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { UserEntity } from 'libs/database/entities/user.entity';
import { GameService } from '../game.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RevolverService {
  constructor(
    //repositoryes
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    @InjectRepository(GameProvider)
    private readonly providerRepository: Repository<GameProvider>,
    @InjectRepository(MetaData)
    private readonly metaDataRepository: Repository<MetaData>,

    //services
    private readonly configServce: ConfigService,
  ) {}

  //refetchGames
  async refreshProvider(reqUrl: String) {
    try {
      const responce = await fetch(`${reqUrl}`);
      const data = await responce.json();
      const GameData = await data.data.availableGames;
      const result = await this.processAndSaveGames(GameData);
      return result;
    } catch (error) {
      throw new HttpException(
        'ERROR DUARING REFRESH PROVIDER',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  //LUNCH REVOLVER GAME
  async lunchRevolverGame(data: LaunchGameDto, user: UserEntity) {
    const baseUrl = await this.configServce.get('REVOLVER_URL');

    const OPERATOOR = await this.configServce.get('REVOLVER_OPERATOR');
    const GAME_ID = data.gameId;
    const LANG = data.lang || 'en';
    const VARIANT = data.variant || 'desktop';
    const EXIT_URL = data.exitUrl || '';

    const isDemo = data.demo === '1' || data.demo === 'true';

    const uuid = randomUUID().replace(/-/g, '');

    let token = isDemo ? 'XYZ' : uuid;

    const LUNCH_GAME_URL = `${baseUrl}/launch/generic?operator=${OPERATOOR}&exit_url=${EXIT_URL}&game=${GAME_ID}&token=${token}&lang=${LANG}&variant=${VARIANT}&freeplay=${isDemo}`;

    const request = await fetch(`${LUNCH_GAME_URL}`);
    console.log(request);
    const res = await request.json();
    console.log(res);

    if (!isDemo) {
      await this.createGameSession({
        token: token,
        gameId: GAME_ID,
        playerId: user.id,
        isActive: true,
      });
    }

    return {
      code: 200,
      lunch_game_url: res.data.URL,
    };
  }
  //LUNCH REVOLVER GAME

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

  //CREATE GAME SESSION
  private async createGameSession(data: GameSession) {
    const playerId = data.playerId;
    try {
      const findActiveSession = await this.gameSessionRepository.findOne({
        where: {
          playerId: playerId,
          isActive: true,
        },
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
  //CREATE GAME SESSION

  //FIND OR CREATE GAME
  private async findOrCreateGame(DATA: GameInterface) {
    const FIND_GAME = await this.gameRepository.findOne({
      where: {
        gameUUID: DATA.gameUUID,
      },
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
      message: 'REVOLVER provider gamelist updated succesfully',
      newGames: savedGames,
    };
  }

  //FIND OR CREATE PROVIDER
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

  ///////////////===================================/////////////////
}
