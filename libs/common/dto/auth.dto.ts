import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsMobilePhone,
  IsDateString,
  Matches,
  isNotEmpty,
  isString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SignUpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsMobilePhone()
  @Transform(({ value }) => value?.trim())
  phone!: string;

  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(20, { message: 'Username cannot exceed 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.trim())
  userName!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(50, { message: 'Password cannot exceed 50 characters' })
  password!: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(1, { message: 'First name cannot be empty' })
  @MaxLength(50, { message: 'First name too long' })
  @Transform(({ value }) => value?.trim())
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(1, { message: 'Last name cannot be empty' })
  @MaxLength(50, { message: 'Last name too long' })
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @IsNotEmpty({ message: 'Country is required' })
  @IsString()
  @MinLength(2, { message: 'Country name too short' })
  @Transform(({ value }) => value?.trim())
  country!: string;

  @IsNotEmpty({ message: 'Birthday is required' })
  @IsDateString(
    {},
    { message: 'Birthday must be a valid ISO date (YYYY-MM-DD)' },
  )
  @Type(() => String)
  birthDay!: string;
}

export class SignInDto {
  @IsNotEmpty({ message: 'Username is required' })
  @Transform(({ value }) => value?.trim())
  userName!: string;

  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class SignInDtoMS {
  @IsNotEmpty({ message: 'Username is required' })
  @Transform(({ value }) => value?.trim())
  userName!: string;

  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsString()
  ip?: string;
}
