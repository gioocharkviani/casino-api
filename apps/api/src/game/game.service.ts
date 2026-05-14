import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GameService {
  constructor(private readonly configService: ConfigService) {}

  //------------------GET ALL GAMES
  async getAllGames() {
    return 'all games';
  }
  //------------------END GET ALL GAMES

  //------------------REFRESH PROVIDER GAME LIST
  async refreshProvider(url: String) {
    const res = await fetch(`${url}`);
    const data = await res.json();
    return data;
  }
  //------------------END REFRESH PROVIDER GAME LIST
}
