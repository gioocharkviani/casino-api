import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { getRequestDto } from 'libs/common/dto/getRequest.dto';
import { LaunchGameDto } from 'libs/common/dto/LunchGame.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { favGameDto } from 'libs/common/dto/favGame.dto';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @MessagePattern('GET_ALL_GAME')
  getAllGames(data: getRequestDto) {
    return this.gameService.getAllGames(data);
  }

  @MessagePattern('GET_ALL_PROVIDER')
  getAllProvider() {
    return this.gameService.getAllProvider();
  }

  @MessagePattern('GET_CATEGORIES_GAME')
  getAllGameByCategories() {
    return this.gameService.getAllGameByCategories();
  }

  @MessagePattern('GET_FAVORITE_GAME')
  getAllfavoriteGame(user: UserEntity) {
    return this.gameService.getAllfavoriteGame(user);
  }
  @MessagePattern('TOGGLE_FAVORITE_GAME')
  toggleFavGame(data: favGameDto) {
    return this.gameService.toggleFavGame(data);
  }

  @MessagePattern('LUNCH_GAME')
  lunchGame({ data, user }: { data: LaunchGameDto; user: UserEntity }) {
    return this.gameService.lunchGame(data, user);
  }

  @MessagePattern('VALIDATE_GAME_SESSION')
  validateGameSession(token: string) {
    return this.gameService.validateGameSession(token);
  }

  // Provider-agnostic dispatchers: resolve the game's provider prefix and
  // route to the right adapter (revolver, nuxgame, ...). Callers (promotions,
  // admin) should use these instead of a provider-specific message pattern.
  @MessagePattern('GRANT_FREE_SPINS')
  grantFreeSpins(
    @Payload()
    params: {
      playerId: string;
      game: string;
      numberOfFreeSpins: number;
      betAmountPerFreeSpin: number;
      currency: string;
      expiresAt: string;
      transactionId: string;
    },
  ) {
    return this.gameService.grantFreeSpins(params);
  }

  @MessagePattern('GET_DEMO_URL')
  getDemoUrl(@Payload() data: { gameId: string; lang?: string }) {
    return this.gameService.getDemoUrl(data.gameId, data.lang);
  }

  // ADMIN
  @MessagePattern('ADMIN_GET_ALL_GAMES')
  adminGetAllGames(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      search?: string;
      provider?: string;
      isActive?: boolean;
      category?: string;
    },
  ) {
    return this.gameService.adminGetAllGames(data);
  }

  @MessagePattern('ADMIN_SHOW_GAME')
  adminShowGame(@Payload() gameId: number) {
    return this.gameService.adminShowGame(gameId);
  }

  @MessagePattern('ADMIN_HIDE_GAME')
  adminHideGame(@Payload() gameId: number) {
    return this.gameService.adminHideGame(gameId);
  }

  @MessagePattern('ADMIN_ADD_GAME_CATEGORY')
  adminAddToCategory(
    @Payload() data: { gameId: number; category: string },
  ) {
    return this.gameService.adminAddToCategory(data);
  }

  @MessagePattern('ADMIN_REMOVE_GAME_CATEGORY')
  adminRemoveFromCategory(
    @Payload() data: { gameId: number; category: string },
  ) {
    return this.gameService.adminRemoveFromCategory(data);
  }

  @MessagePattern('ADMIN_GET_GAME_CATEGORIES')
  adminGetGameCategories(@Payload() gameId: number) {
    return this.gameService.adminGetGameCategories(gameId);
  }

  @MessagePattern('ADMIN_GET_PROVIDERS')
  adminGetAllProviders() {
    return this.gameService.getAllProvider();
  }

  @MessagePattern('ADMIN_GET_CATEGORY_OVERVIEW')
  adminGetCategoryOverview() {
    return this.gameService.adminGetCategoryOverview();
  }

  @MessagePattern('ADMIN_LIST_CATEGORY_DEFS')
  adminListCategoryDefs() {
    return this.gameService.adminListCategoryDefs();
  }

  @MessagePattern('ADMIN_CREATE_CATEGORY_DEF')
  adminCreateCategoryDef(
    @Payload() data: { key: string; label: string; color?: string; sortOrder?: number },
  ) {
    return this.gameService.adminCreateCategoryDef(data);
  }

  @MessagePattern('ADMIN_DELETE_CATEGORY_DEF')
  adminDeleteCategoryDef(@Payload() key: string) {
    return this.gameService.adminDeleteCategoryDef(key);
  }

  @MessagePattern('ADMIN_LIVE_SESSIONS')
  adminGetLiveSessions() {
    return this.gameService.adminGetLiveSessions();
  }

  @MessagePattern('ADMIN_FORCE_CLOSE_SESSION')
  adminForceCloseSession(@Payload() sessionId: number) {
    return this.gameService.adminForceCloseSession(sessionId);
  }
}
