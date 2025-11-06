import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

export interface AdminTransactionFilters {
  userId?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AdminTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAllTransactions(filters: AdminTransactionFilters = {}) {
    const { userId, status, type, limit = 50, offset = 0 } = filters;

    const where: Prisma.TransactionWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status as any;
    }

    if (type) {
      where.type = type as any;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          wallet: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }
}
