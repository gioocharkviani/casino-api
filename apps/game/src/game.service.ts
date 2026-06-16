import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FavoriteGame,
  Game,
  GameCategories,
  GameProvider,
  GameSession,
} from 'libs/database/entities/game.entity';
import { Repository } from 'typeorm';
import { RevolverService } from './revolver/revolver.service';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { favGameDto } from 'libs/common/dto/favGame.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(FavoriteGame)
    private readonly favGameRepo: Repository<FavoriteGame>,
    @InjectRepository(GameProvider)
    private readonly providerRepo: Repository<GameProvider>,
    @InjectRepository(GameCategories)
    private readonly gameCategoriesRepo: Repository<GameCategories>,
    @InjectRepository(GameSession)
    private readonly gameSession: Repository<GameSession>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    private readonly revolverProvider: RevolverService,
  ) {}

  //GET ALL GAME
  async getAllGames(data: getRequestDto) {
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

    queryBuilder.andWhere('game.isActive = :isActive', {
      isActive: true,
    });

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

  //GET ALL GAME

  //GET ALL FAVORITE GAME
  async getAllfavoriteGame(user: UserEntity) {
    const req = await this.favGameRepo.find({
      where: { playerId: user.id },
      select: {
        createdAt: false,
        updatedAt: false,
        game: {
          createdAt: false,
          description: false,
          gameProvider: false,
          updatedAt: false,
          marketingMaterialsZip: false,
          rules: false,
          metaData: false,
          status: false,
        },
        gameUUID: false,
        playerId: false,
        id: false,
      },
      relations: { game: true },
      order: {
        createdAt: 'DESC',
      },
    });
    return {
      code: 200,
      data: req,
      message: 'Success',
    };
  }
  //GET ALL FAVORITE GAME

  //ADD OR REMOVE FAVORITE GAME
  async toggleFavGame(data: favGameDto) {
    const findGame = await this.favGameRepo.findOne({
      where: {
        gameUUID: data.gameId,
        playerId: data.playerId,
      },
    });

    if (findGame && findGame.id) {
      await this.favGameRepo.delete(findGame.id);
      return {
        code: 201,
        message: 'Game removed from favorites successfully',
        isFavorite: false,
      };
    }

    await this.favGameRepo.save({
      gameUUID: data.gameId,
      playerId: data.playerId,
    });
    return {
      code: 201,
      message: 'Game added to favorites successfully',
      isFavorite: true,
    };
  }
  //ADD OR REMOVE FAVORITE GAME

  //GET ALL PROVIDER
  async getAllProvider() {
    const allProvider = await this.providerRepo.find({
      select: {
        id: true,
        logo: true,
        name: true,
        prefix: true,
        games: false,
        createdAt: false,
        updatedAt: false,
      },
    });
    return {
      code: 200,
      data: allProvider,
      message: 'Success',
    };
  }
  //GET ALL PROVIDER

  //GET ALL GAME BY CATEGORIES
  async getAllGameByCategories() {
    const categories = await this.gameCategoriesRepo.find({
      where: {
        game: { isActive: true },
      },
      select: {
        categories: true,
        gameId: false,
        game: {
          description: true,
          gameHumanReadableId: true,
          gameName: true,
          gameProvider: true,
          gameUUID: true,
          id: true,
          isActive: true,
          marketingMaterialsZip: true,
          metaData: true,
          providerId: true,
          rules: true,
          status: true,
          thumbnail: true,
        },
      },
      relations: { game: true },
    });

    const groupedData = {};
    for (const item of categories) {
      const categoryName = item.categories;
      if (!groupedData[categoryName]) {
        groupedData[categoryName] = [];
      }

      groupedData[categoryName].push(item.game);
    }

    return {
      code: 200,
      data: groupedData,
      message: 'Success',
    };
  }
  //GET ALL GAME BY CATEGORIES

  //LUNCH GAME
  async lunchGame(data: LaunchGameDto, user: UserEntity) {
    const findGame = await this.gameRepository.findOne({
      where: {
        gameUUID: data.gameId,
      },
      relations: {
        gameProvider: true,
      },
    });

    if (findGame?.gameProvider?.prefix === 'rvlvr') {
      const res = await this.revolverProvider.lunchRevolverGame(data, user);
      return res;
    }
    return data;
  }
  //LUNCH GAME

  //VALIDATE GAME SESSION
  async validateGameSession(token: string) {
    const findToken: GameSession | null =
      await this.gameSessionRepository.findOne({
        where: {
          token: token,
          isActive: true,
        },
        select: {
          gameId: true,
          playerId: true,
          token: true,
        },
      });

    if (!findToken) {
      return {
        valid: false,
        data: null,
      };
    }

    return {
      valid: true,
      data: findToken,
    };
  }
  //VALIDATE GAME SESSION
}
