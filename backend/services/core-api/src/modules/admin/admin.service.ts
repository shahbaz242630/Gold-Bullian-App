import { Injectable } from '@nestjs/common';
import { KycStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export interface AdminUserFilters {
  kycStatus?: KycStatus;
  email?: string;
  phoneNumber?: string;
  limit?: number;
  offset?: number;
}

export interface AdminTransactionFilters {
  userId?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(filters: AdminUserFilters = {}) {
    const { kycStatus, email, phoneNumber, limit = 50, offset = 0 } = filters;

    const where: Prisma.UserWhereInput = {};

    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (phoneNumber) {
      where.phoneNumber = { contains: phoneNumber };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          kycProfile: true,
          wallets: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      limit,
      offset,
    };
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycProfile: true,
        wallets: true,
        nominee: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

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

  async getSystemStats() {
    const [userCount, transactionCount, kycStats, walletStats] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.user.groupBy({
        by: ['kycStatus'],
        _count: true,
      }),
      this.prisma.wallet.aggregate({
        _sum: {
          balanceGrams: true,
          lockedGrams: true,
        },
      }),
    ]);

    return {
      users: {
        total: userCount,
        byKycStatus: kycStats.reduce(
          (acc, stat) => {
            acc[stat.kycStatus] = stat._count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      transactions: {
        total: transactionCount,
      },
      wallets: {
        totalBalanceGrams: walletStats._sum.balanceGrams?.toString() ?? '0',
        totalLockedGrams: walletStats._sum.lockedGrams?.toString() ?? '0',
      },
    };
  }
}
