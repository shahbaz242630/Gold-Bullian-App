import { Injectable } from '@nestjs/common';
import { KycStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

export interface AdminUserFilters {
  kycStatus?: KycStatus;
  email?: string;
  phoneNumber?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AdminUsersService {
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
}
