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

  // ADMIN: get all transactions with pagination + filters
  async adminGetAllTransactions(filters: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    provider?: string;
    gameId?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: 'createdAt' | 'amount';
    sortDir?: 'ASC' | 'DESC';
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy === 'amount' ? 'tx.amount' : 'tx.createdAt';
    const sortDir = filters.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.game', 'game')
      .leftJoin('game.gameProvider', 'gameProvider')
      .orderBy(sortBy, sortDir)
      .skip(skip)
      .take(limit);

    if (filters.userId) qb.andWhere('tx.userId = :userId', { userId: filters.userId });
    if (filters.type)   qb.andWhere('tx.type = :type', { type: filters.type });
    if (filters.status) qb.andWhere('tx.status = :status', { status: filters.status });
    if (filters.gameId) qb.andWhere('tx.gameId = :gameId', { gameId: filters.gameId });
    if (filters.provider) qb.andWhere('gameProvider.name = :provider', { provider: filters.provider });
    if (filters.dateFrom) qb.andWhere('tx.createdAt >= :dateFrom', { dateFrom: new Date(filters.dateFrom) });
    if (filters.dateTo)   qb.andWhere('tx.createdAt <= :dateTo', { dateTo: new Date(filters.dateTo) });
    if (filters.minAmount !== undefined) qb.andWhere('tx.amount >= :minAmount', { minAmount: filters.minAmount });
    if (filters.maxAmount !== undefined) qb.andWhere('tx.amount <= :maxAmount', { maxAmount: filters.maxAmount });

    const [data, total] = await qb.getManyAndCount();
    return { code: 200, data, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ADMIN: where a specific user spends the most (grouped by game / provider)
  // "Spend" = DEBIT transactions (bets placed), which is what actually leaves
  // the player's balance during play — deposits/withdrawals are funding
  // events, not play spend, so they're excluded here.
  async adminGetUserTopSpend(userId: string, dateFrom?: string, dateTo?: string) {
    const baseQb = () => {
      const qb = this.transactionRepository
        .createQueryBuilder('tx')
        .leftJoin('tx.game', 'game')
        .leftJoin('game.gameProvider', 'gameProvider')
        .where('tx.userId = :userId', { userId })
        .andWhere('tx.type = :type', { type: 'debit' });
      if (dateFrom) qb.andWhere('tx.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
      if (dateTo)   qb.andWhere('tx.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
      return qb;
    };

    const byGame = await baseQb()
      .select('tx.gameId', 'gameId')
      .addSelect('game.gameName', 'gameName')
      .addSelect('gameProvider.name', 'providerName')
      .addSelect('SUM(tx.amount)', 'totalSpent')
      .addSelect('COUNT(tx.id)', 'betCount')
      .groupBy('tx.gameId')
      .addGroupBy('game.gameName')
      .addGroupBy('gameProvider.name')
      .orderBy('SUM(tx.amount)', 'DESC')
      .limit(20)
      .getRawMany();

    const byProvider = await baseQb()
      .select('gameProvider.name', 'providerName')
      .addSelect('SUM(tx.amount)', 'totalSpent')
      .addSelect('COUNT(tx.id)', 'betCount')
      .groupBy('gameProvider.name')
      .orderBy('SUM(tx.amount)', 'DESC')
      .getRawMany();

    return {
      code: 200,
      data: {
        byGame: byGame.map((r) => ({
          gameId: r.gameId,
          gameName: r.gameName,
          providerName: r.providerName,
          totalSpent: Number(r.totalSpent),
          betCount: Number(r.betCount),
        })),
        byProvider: byProvider.map((r) => ({
          providerName: r.providerName,
          totalSpent: Number(r.totalSpent),
          betCount: Number(r.betCount),
        })),
      },
    };
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
