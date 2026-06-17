import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class verifyDtoNotification {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsOptional()
  @IsString()
  firstName?: string;
  @IsOptional()
  @IsString()
  token?: string;
  @IsEmail()
  userEmail!: string;
}

export class emailDto {
  @IsNotEmpty()
  @IsEmail({}, { each: true })
  recipients!: string[];
  @IsString()
  subject!: string;
  @IsString()
  html!: string;
  @IsOptional()
  @IsString()
  text?: string;
}
