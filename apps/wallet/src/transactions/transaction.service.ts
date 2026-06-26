import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionType } from 'libs/common';
import { CreateTransactionDto } from 'libs/common/dto/transaction.dto';
import { TransactionEntity } from 'libs/database/entities/transaction.entity';
import { lastValueFrom } from 'rxjs';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class transactionService {
  constructor(
    @Inject('USER_MS_SERVICE') private userClient: ClientProxy,
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
        status: data.status,
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
      },
    });
    return !!rollback;
  }

  async updateTransaction(transaction: TransactionEntity) {
    return await this.transactionRepository.save(transaction);
  }

  // ADMIN: get transactions by userId directly (no token needed)
  async getTransactionsByUserId(userId: string, limit = 100) {
    const [transactions, count] =
      await this.transactionRepository.findAndCount({
        where: { userId },
        relations: { game: true },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          reason: true,
          balanceBefore: true,
          balanceAfter: true,
          transactionId: true,
          createdAt: true,
          game: { gameName: true },
        },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    return { code: 200, data: transactions, total: count };
  }

  //GET ALL USER TRANSATCTION
  async getUserTransactions(token: string) {
    try {
      const user = await lastValueFrom(this.userClient.send('GET_USER', token));
      if (!user) {
        throw new RpcException({
          message: 'UNAUTHORIZED',
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }
      const [findTransaction, count] =
        await this.transactionRepository.findAndCount({
          where: {
            userId: user.id,
          },
          relations: {
            game: true,
          },
          select: {
            amount: true,
            createdAt: true,
            type: true,
            user: false,
            balanceAfter: false,
            balanceBefore: false,
            gameId: false,
            game: {
              gameName: true,
            },
            gameSessionId: false,
            id: false,
            paymentId: false,
            reason: false,
            roundId: false,
            status: false,
            transactionId: false,
            userId: false,
          },
        });

      return {
        count: count,
        data: findTransaction,
      };
    } catch (error) {
      throw new RpcException(
        'something wend wrong duaring fetch user transactions',
      );
    }
  }
}
