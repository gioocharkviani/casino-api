import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class LaunchGameDto {
  @IsString()
  @IsNotEmpty()
  gameId!: string;

  @IsString()
  @IsNotEmpty()
  lang!: string;

  @IsOptional()
  @IsIn(['desktop', 'mobile'])
  variant?: string;

  @IsOptional()
  @IsString()
  exitUrl?: string;

  @IsOptional()
  @IsString()
  demo!: string;
}
