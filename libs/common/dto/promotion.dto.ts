import { IsEnum, IsString } from 'class-validator';

export enum eventTypes {
  DEPOSIT = 'deposit_event',
  WITHDRAWAL = 'withdrawal_event',
  BIRTHDAY = 'birthday_event',
  CREDIT_DEBIT = 'creditOrDebit_event',
}

export class promotionEventListenerDto {
  @IsEnum({ enum: eventTypes })
  type?: eventTypes;
}
