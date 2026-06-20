export enum TransactionType {
  CREDIT = 'credit',
  DEBIT_AND_CREDIT = 'debit&credit',
  DEPOSIT = 'deposit',
  DEBIT = 'debit',
  WITHDRAWAL = 'withdrawal',
  BONUS = 'bonus',
  ROLLBACK = 'rollback',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatusEnum {
  PENDING = 'pending',
  APPROVED = 'approved',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILD = 'faild',
}
