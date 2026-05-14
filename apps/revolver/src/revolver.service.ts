import { Injectable } from '@nestjs/common';

@Injectable()
export class RevolverService {
  getAllGames(): string {
    return 'here is all games';
  }
}
