import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Game,
  GameProvider,
  MetaData,
} from 'libs/database/entities/game.entity';
import { Repository } from 'typeorm';
import { gameProvider } from './interface/provider.interface';
import { gameMetaData } from './interface/metaData.interface';
import { GameInterface } from './interface/game.interface';

@Injectable()
export class RevolverService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameProvider)
    private readonly providerRepository: Repository<GameProvider>,
    @InjectRepository(MetaData)
    private readonly metaDataRepository: Repository<MetaData>,
  ) {}

  // getAllGamesFromDatabase
  async getAllGames() {
    const res = await this.gameRepository.find({
      select: {
        gameUUID: true,
        gameHumanReadableId: true,
        gameName: true,
        status: true,
        description: true,
        thumbnail: true,
        rules: true,
        // MetaData-ს ნაწილი
        metaData: {
          supports_promo_freespins: true,
          lines: true,
          reelsWidth: true,
          reelsHeight: true,
        },

        gameProvider: {
          name: true,
          prefix: true,
          logo: true,
        },
      },
      relations: {
        metaData: true,
        gameProvider: true,
      },
    });
    return res;
  }
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

  ///////////////===================================/////////////////
  private async processAndSaveGames(gameData: GameInterface[]) {
    let processed = 0;
    for (const game of gameData) {
      try {
        await this.findOrCreateGame(game);
        processed++;
      } catch (error) {
        console.error(`Error processing game ${game?.gameName}:`);
        continue;
      }
    }
    return 'PROVIDER REFRESH SUCCESSFULLY';
  }

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
      status: 201,
      message: 'REVOLVER provider gamelist updated succesfully',
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
    console.log(gameMetadata);
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
