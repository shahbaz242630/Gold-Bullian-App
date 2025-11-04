import { Injectable } from '@nestjs/common';
import { Prisma, WalletType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateUserDto) {
    const payload: Prisma.UserCreateInput = this.mapToCreateInput(data);

    return this.prisma.user.create({ data: payload });
  }

  async createWithDefaults(data: CreateUserDto) {
    return this.prisma.(async (trx) => {
      const user = await trx.user.create({ data: this.mapToCreateInput(data) });

      await trx.wallet.create({
        data: {
          userId: user.id,
          type: WalletType.GOLD,
          balanceGrams: new Prisma.Decimal(0),
          lockedGrams: new Prisma.Decimal(0),
        },
      });

      return user;
    });
  }

  findBySupabaseUid(supabaseUid: string) {
    return this.prisma.user.findUnique({ where: { supabaseUid } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private mapToCreateInput(data: CreateUserDto): Prisma.UserCreateInput {
    return {
      supabaseUid: data.supabaseUid,
      email: data.email,
      phoneNumber: data.phoneNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      countryCode: data.countryCode,
    };
  }
}

