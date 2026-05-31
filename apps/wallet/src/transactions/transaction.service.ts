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

  // CREATE OR UPDATE TRANSACTION
  async createTransaction(data: CreateTransactionDto) {
    const transactionType = data.type as TransactionType;

    let existingTransaction = await this.transactionRepository.findOne({
      where: { transactionId: data.transactionId },
    });

    if (existingTransaction) {
      existingTransaction.type = transactionType;
      existingTransaction.reason = data.reason;

      return await this.transactionRepository.save(existingTransaction);
    } else {
      const createTransaction = this.transactionRepository.create({
        amount: data.amount,
        balanceAfter: data?.balanceAfter,
        balanceBefore: data?.balanceBefore,
        gameId: data?.gameId,
        gameSessionId: data.gameSessionId,
        reason: data?.reason,
        roundId: data?.roundId,
        userId: data.userId!,
        transactionId: data.transactionId,
        type: transactionType,
      });
      return await this.transactionRepository.save(createTransaction);
    }
  }
  //CREATE TRANSACTION

  //CHECK DUPLICATE TRANSACTIONS
  async checkExiting(transactionId: string) {
    const existing = await this.transactionRepository.findOne({
      where: {
        transactionId: transactionId,
      },
    });
    if (existing) {
      return existing;
    }
    return null;
  }
  //CHECK DUPLICATE TRANSACTIONS

  // CHECK IF ROUND ALREADY HAS ROLLBACK
  async checkRoundRollback(roundId: string, playerId: string) {
    const rollback = await this.transactionRepository.findOne({
      where: {
        roundId: roundId,
        userId: playerId,
        type: TransactionType.ROLLBACK,
      },
    });
    return !!rollback;
  }

  async updateTransaction(transaction: TransactionEntity) {
    return await this.transactionRepository.save(transaction);
  }
}
