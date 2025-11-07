import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

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
