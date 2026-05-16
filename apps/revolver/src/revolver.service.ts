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
import { GameFilters } from './interface/filters.interface';

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
  async getAllGames(data: GameFilters) {
    const page = data?.page ? parseInt(data?.page as any) : 1;
    const limit = data?.limit ? parseInt(data?.limit as any) : 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.metaData', 'metaData')
      .leftJoinAndSelect('game.gameProvider', 'gameProvider')
      .select([
        'game.id',
        'game.gameUUID',
        'game.gameHumanReadableId',
        'game.gameName',
        'game.status',
        'game.description',
        'game.thumbnail',
        'game.rules',
        'game.isActive',
        'metaData.supports_promo_freespins',
        'metaData.lines',
        'metaData.reelsWidth',
        'metaData.reelsHeight',
        'gameProvider.name',
        'gameProvider.prefix',
        'gameProvider.logo',
      ]);

    if (data?.isActive !== undefined && data?.isActive !== null) {
      queryBuilder.andWhere('game.isActive = :isActive', {
        isActive: data.isActive,
      });
    }

    if (data?.search && data.search.trim() !== '') {
      queryBuilder.andWhere('game.gameName LIKE :search', {
        search: `%${data.search}%`,
      });
    }

    if (data?.provider && data.provider.trim() !== '') {
      queryBuilder.andWhere('gameProvider.name = :provider', {
        provider: data.provider,
      });
    }

    queryBuilder.skip(skip).take(limit).orderBy('game.id', 'ASC');

    const [res, total] = await queryBuilder.getManyAndCount();

    return {
      status: 'OK',
      data: res,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      filters: {
        isActive: data?.isActive,
        search: data?.search,
        provider: data?.provider,
      },
    };
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
