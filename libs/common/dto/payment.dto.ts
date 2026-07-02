import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class depositDto {
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardholderName?: string;

  @IsOptional()
  @IsNumber()
  cardExpMonth?: number;

  @IsOptional()
  @IsNumber()
  cardExpYear?: number;

  @IsOptional()
  @IsString()
  cvv?: string;

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
  accountHolderName?: string;

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

export class PayInExtraWebhookDto {
  @IsString()
  paymentId!: string;

  @IsString()
  status!: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  merchantReference?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  webhookSecret?: string;
}
