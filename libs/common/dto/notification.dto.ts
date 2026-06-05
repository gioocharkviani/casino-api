import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class verifyDtoNotification {
  @IsString()
  userId!: string;
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
