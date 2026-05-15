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

  //getAllGamesFromDatabase
  async getAllGames() {
    const res = await this.gameRepository.find();
    return res;
  }

  //refetchGames
  async refreshProvider(reqUrl: String) {
    try {
      const responce = await fetch(`${reqUrl}`);
      const data = await responce.json();
      const GameData = await data.data.availableGames;
      const result = await this.processAndSaveGames(GameData);
      console.log(result);
      return GameData;
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
    try {
      for (const game of gameData) {
        await this.findOrCreateGame(game);
        processed++;
      }
      return processed;
    } catch (error) {}
  }

  private async findOrCreateGame(DATA: GameInterface) {
    const FIND_GAME = await this.gameRepository.findOne({
      where: {
        gameUUID: DATA.gameUUID,
      },
    });
    if (FIND_GAME) {
      return;
    } else {
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
      return;
    }
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
    if (!gameMetadata) {
      return null;
    }
    try {
      const existingMetaData = await this.metaDataRepository.findOne({
        where: {
          lines: gameMetadata.lines,
          reelsWidth: gameMetadata.reelsWidth,
          reelsHeight: gameMetadata.reelsHeight,
          marketing_materials: gameMetadata.marketing_materials,
          supports_promo_freespins: gameMetadata.supports_promo_freespins,
        },
      });

      if (existingMetaData) {
        return existingMetaData;
      }
      const createMetaData = this.metaDataRepository.create(gameMetadata);
      const savedMetaData = await this.metaDataRepository.save(createMetaData);
      return savedMetaData;
    } catch (error) {
      throw new HttpException(
        `ERROR DUARING CREATING METADATA `,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  ///////////////===================================/////////////////
}
