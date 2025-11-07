import { Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { KycProfileEntity } from './entities/kyc-profile.entity';

@Injectable()
export class KycService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileByUserId(userId: string): Promise<KycProfileEntity | null> {
    const profile = await this.prisma.kycProfile.findUnique({ where: { userId } });
    return profile ? KycProfileEntity.fromModel(profile) : null;
  }

  async submit(dto: SubmitKycDto): Promise<KycProfileEntity> {
    const now = new Date();
    const payload: Prisma.KycProfileUpsertArgs = {
      where: { userId: dto.userId },
      update: {
        provider: dto.provider,
        providerRef: dto.providerRef,
        status: KycStatus.IN_REVIEW,
        submittedAt: now,
        metadata: dto.metadata as Prisma.InputJsonValue,
        notes: dto.notes,
        updatedAt: now,
      },
      create: {
        userId: dto.userId,
        provider: dto.provider,
        providerRef: dto.providerRef,
        status: KycStatus.IN_REVIEW,
        submittedAt: now,
        metadata: dto.metadata as Prisma.InputJsonValue,
        notes: dto.notes,
      },
    };

    const profile = await this.prisma.kycProfile.upsert(payload);
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { kycStatus: KycStatus.IN_REVIEW },
    }).catch(() => void 0);

    return KycProfileEntity.fromModel(profile);
  }

  async updateStatus(dto: UpdateKycStatusDto): Promise<KycProfileEntity> {
    const existing = await this.prisma.kycProfile.findUnique({ where: { userId: dto.userId } });

    if (!existing) {
      throw new NotFoundException(`KYC profile not found for user ${dto.userId}`);
    }

    const updated = await this.prisma.$transaction(async (trx) => {
      const profile = await trx.kycProfile.update({
        where: { userId: dto.userId },
        data: {
          status: dto.status,
          reviewerId: dto.reviewerId,
          reviewedAt: new Date(),
          notes: dto.notes ?? existing.notes,
        },
      });

      await trx.user.update({
        where: { id: dto.userId },
        data: { kycStatus: dto.status },
      });

      return profile;
    });

    return KycProfileEntity.fromModel(updated);
  }
}

