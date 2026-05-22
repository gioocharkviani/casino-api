import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameSession } from 'libs/database/entities/game.entity';
import { Repository } from 'typeorm';
import { RevolverService } from './revolver/revolver.service';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserEntity } from 'libs/database/entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameSession)
    private readonly gameSessionRepository: Repository<GameSession>,
    private readonly revolverProvider: RevolverService,
  ) {}

  // get all games endpoint
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

  //end get all games endpoint

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
}
