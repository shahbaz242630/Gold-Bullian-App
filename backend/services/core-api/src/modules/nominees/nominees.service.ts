import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { NomineeEntity } from './entities/nominee.entity';
import { UpsertNomineeDto } from './dto/upsert-nominee.dto';

@Injectable()
export class NomineesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string): Promise<NomineeEntity | null> {
    const nominee = await this.prisma.nominee.findUnique({ where: { userId } });
    return nominee ? NomineeEntity.fromModel(nominee) : null;
  }

  async upsert(dto: UpsertNomineeDto): Promise<NomineeEntity> {
    const nominee = await this.prisma.nominee.upsert({
      where: { userId: dto.userId },
      update: {
        fullName: dto.fullName,
        relationship: dto.relationship,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        documents: dto.documents as Prisma.InputJsonValue,
      },
      create: {
        userId: dto.userId,
        fullName: dto.fullName,
        relationship: dto.relationship,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        documents: dto.documents as Prisma.InputJsonValue,
      },
    });

    return NomineeEntity.fromModel(nominee);
  }
}

