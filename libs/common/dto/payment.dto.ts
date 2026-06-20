//FROM FRONTEND

import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class depositDto {
  //CARD DETAILS
  @IsString()
  cardNumber?: string;
  @IsString()
  cardholderName?: string;
  @IsNumber()
  cardExpMonth?: number;
  @IsNumber()
  cardExpYear?: number;
  @IsString()
  cvv?: string;
  //CARD DETAILS
  @IsNumber()
  amount!: number;
  @IsOptional()
  @IsString()
  token?: string;
}

export class withdrawalDto {
  @IsNumber()
  amount!: number;
  @IsString()
  iban!: string;
  @IsOptional()
  @IsString()
  token?: string;
}

export class payInExtraDto {
  @IsNumber()
  amount!: number;
  @IsString()
  currency?: string;
  @IsString()
  paymentMethod?: string;
  @IsString()
  merchantReference?: string;

  @IsObject()
  customer?: object;
}
