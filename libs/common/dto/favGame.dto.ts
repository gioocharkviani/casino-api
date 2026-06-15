import { IsString } from 'class-validator';

export class favGameDto {
  @IsString()
  playerId!: string;
  @IsString()
  gameId!: string;
}
