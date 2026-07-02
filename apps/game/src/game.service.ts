import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CategoryDefinition,
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
    @InjectRepository(CategoryDefinition)
    private readonly categoryDefRepo: Repository<CategoryDefinition>,
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
          gameName: true,
          gameUUID: true,
          id: true,
          gameHumanReadableId: true,
          thumbnail: true,
          isActive: true,
          providerId: true,
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
    const games = req.map((fav) => fav.game);
    return {
      code: 200,
      data: games,
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

  // ADMIN: get all games (including inactive)
  async adminGetAllGames(data: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    isActive?: boolean;
    category?: string;
  }) {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 50;
    const skip = (page - 1) * limit;

    const qb = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.gameProvider', 'gameProvider')
      .leftJoinAndSelect('game.metaData', 'metaData');

    if (data.search) {
      qb.andWhere('game.gameName LIKE :search', {
        search: `%${data.search}%`,
      });
    }
    if (data.provider) {
      qb.andWhere('gameProvider.name = :provider', { provider: data.provider });
    }
    if (data.isActive !== undefined) {
      qb.andWhere('game.isActive = :isActive', { isActive: data.isActive });
    }
    if (data.category) {
      qb.innerJoin(
        'game_categories',
        'gc',
        'gc.gameId = game.id AND gc.categories = :cat',
        { cat: data.category },
      );
    }

    qb.skip(skip).take(limit).orderBy('game.id', 'ASC');
    const [games, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      code: 200,
      data: games,
      total,
      page,
      totalPages,
      message: 'Success',
    };
  }

  // ADMIN: show a game (set isActive = true)
  async adminShowGame(gameId: number) {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return { code: 404, data: null, message: 'Game not found' };
    game.isActive = true;
    await this.gameRepository.save(game);
    return { code: 200, data: { id: gameId, isActive: true }, message: 'Game is now visible' };
  }

  // ADMIN: hide a game (set isActive = false)
  async adminHideGame(gameId: number) {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) return { code: 404, data: null, message: 'Game not found' };
    game.isActive = false;
    await this.gameRepository.save(game);
    return { code: 200, data: { id: gameId, isActive: false }, message: 'Game is now hidden' };
  }

  // ADMIN: add game to a category
  async adminAddToCategory(data: {
    gameId: number;
    category: string;
  }) {
    const game = await this.gameRepository.findOne({
      where: { id: data.gameId },
    });
    if (!game) return { code: 404, data: null, message: 'Game not found' };

    const existing = await this.gameCategoriesRepo.findOne({
      where: { gameId: data.gameId, categories: data.category },
    });
    if (existing) {
      return { code: 200, data: null, message: 'Game already in this category' };
    }

    await this.gameCategoriesRepo.save({
      gameId: data.gameId,
      categories: data.category,
    });
    return { code: 201, data: null, message: `Game added to ${data.category}` };
  }

  // ADMIN: remove game from a category
  async adminRemoveFromCategory(data: {
    gameId: number;
    category: string;
  }) {
    const existing = await this.gameCategoriesRepo.findOne({
      where: { gameId: data.gameId, categories: data.category },
    });
    if (!existing) {
      return { code: 404, data: null, message: 'Game not in this category' };
    }
    await this.gameCategoriesRepo.remove(existing);
    return {
      code: 200,
      data: null,
      message: `Game removed from ${data.category}`,
    };
  }

  // ADMIN: get category assignments for a game
  async adminGetGameCategories(gameId: number) {
    const assignments = await this.gameCategoriesRepo.find({
      where: { gameId },
    });
    return {
      code: 200,
      data: assignments.map((a) => a.categories),
      message: 'Success',
    };
  }

  // ADMIN: list category definitions
  async adminListCategoryDefs() {
    const defs = await this.categoryDefRepo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return { code: 200, data: defs };
  }

  // ADMIN: create a new category definition
  async adminCreateCategoryDef(data: {
    key: string;
    label: string;
    color?: string;
    sortOrder?: number;
  }) {
    const key = data.key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!key) return { code: 400, message: 'Invalid key' };

    const exists = await this.categoryDefRepo.findOne({ where: { key } });
    if (exists) return { code: 409, message: 'Category key already exists' };

    const def = await this.categoryDefRepo.save(
      this.categoryDefRepo.create({
        key,
        label: data.label,
        color: data.color ?? 'bg-gray-600',
        sortOrder: data.sortOrder ?? 99,
      }),
    );
    return { code: 201, data: def };
  }

  // ADMIN: delete a category definition (only if no games use it)
  async adminDeleteCategoryDef(key: string) {
    const def = await this.categoryDefRepo.findOne({ where: { key } });
    if (!def) return { code: 404, message: 'Category not found' };

    const count = await this.gameCategoriesRepo.count({ where: { categories: key } });
    if (count > 0) {
      return {
        code: 409,
        message: `Cannot delete: ${count} game(s) still assigned to this category. Remove them first.`,
      };
    }

    await this.categoryDefRepo.remove(def);
    return { code: 200, message: 'Category deleted' };
  }

  // ADMIN: count games per category
  async adminGetCategoryOverview() {
    const all = await this.gameCategoriesRepo.find({
      select: { categories: true, gameId: true },
    });
    const overview: Record<string, number> = {};
    for (const row of all) {
      overview[row.categories] = (overview[row.categories] ?? 0) + 1;
    }
    return { code: 200, data: overview };
  }

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
