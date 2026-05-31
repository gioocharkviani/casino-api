import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from 'libs/common';
import { CreateTransactionDto } from 'libs/common/dto/transaction.dto';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class transactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  //CREATE TRANSACTION
  async createTransaction(data: CreateTransactionDto) {
    const transactionType = data.type as TransactionType;
    const createTransaction = this.transactionRepository.create({
      amount: data.amount,
      balanceAfter: data?.balanceAfter,
      balanceBefore: data?.balanceBefore,
      gameId: data?.gameId,
      gameSessionId: data.gameSessionId,
      reason: data?.reason,
      roundId: data?.roundId,
      userId: data.userId,
      transactionId: data.transactionId,
      type: transactionType,
    });
    return await this.transactionRepository.save(createTransaction);
  }

  //CHECK EXITING TRANSACTION
  async exitingTransaction(transactionId: string) {
    return await this.transactionRepository.findOne({
      where: { transactionId: transactionId },
    });
  }

  //CHECK IF ROUNT HAS ROLLBACK
  async isRoundRollbacked(roundId?: string, playerId?: string) {
    if (!roundId || !playerId) return false;
    const rollback = await this.transactionRepository.findOne({
      where: {
        roundId: roundId,
        userId: playerId,
        type: TransactionType.ROLLBACK,
      },
    });
    return !!rollback;
  }
}
