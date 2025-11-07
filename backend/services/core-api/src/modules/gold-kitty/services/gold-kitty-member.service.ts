import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AddMemberDto } from '../dto/add-member.dto';
import { GoldKittyMemberEntity } from '../entities/gold-kitty-member.entity';
import { GoldKittyValidationService } from './gold-kitty-validation.service';

/**
 * Gold Kitty Member Service
 *
 * Handles member management (add, remove, query)
 * Single Responsibility: Member operations
 */
@Injectable()
export class GoldKittyMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: GoldKittyValidationService,
  ) {}

  /**
   * Add a new member to the kitty
   */
  async addMember(dto: AddMemberDto): Promise<GoldKittyMemberEntity> {
    // Verify kitty exists
    const kitty = await this.prisma.goldKitty.findUnique({
      where: { id: dto.kittyId },
    });

    if (!kitty) {
      throw new NotFoundException(`Kitty ${dto.kittyId} not found`);
    }

    // Validate member count
    await this.validationService.validateMemberCount(dto.kittyId, kitty.totalRounds);

    // Validate allocation order is unique
    await this.validationService.validateAllocationOrder(
      dto.kittyId,
      dto.allocationOrder
    );

    // Check if user is already a member
    const existingMember = await this.prisma.goldKittyMember.findFirst({
      where: { kittyId: dto.kittyId, userId: dto.userId },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this kitty');
    }

    // Add member
    const member = await this.prisma.goldKittyMember.create({
      data: {
        kittyId: dto.kittyId,
        userId: dto.userId,
        allocationOrder: dto.allocationOrder,
      },
    });

    return GoldKittyMemberEntity.fromModel(member);
  }

  /**
   * Remove a member from the kitty
   */
  async removeMember(kittyId: string, memberId: string): Promise<void> {
    const member = await this.prisma.goldKittyMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.kittyId !== kittyId) {
      throw new NotFoundException('Member not found in this kitty');
    }

    // Soft delete: mark as inactive
    await this.prisma.goldKittyMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }

  /**
   * Get all members of a kitty
   */
  async getKittyMembers(kittyId: string): Promise<GoldKittyMemberEntity[]> {
    const members = await this.prisma.goldKittyMember.findMany({
      where: { kittyId, isActive: true },
      orderBy: { allocationOrder: 'asc' },
    });

    return members.map(GoldKittyMemberEntity.fromModel);
  }

  /**
   * Get a specific member by ID
   */
  async getMemberById(memberId: string): Promise<GoldKittyMemberEntity> {
    const member = await this.prisma.goldKittyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    return GoldKittyMemberEntity.fromModel(member);
  }

  /**
   * Get member by allocation order
   */
  async getMemberByAllocationOrder(
    kittyId: string,
    allocationOrder: number
  ): Promise<GoldKittyMemberEntity | null> {
    const member = await this.prisma.goldKittyMember.findFirst({
      where: { kittyId, allocationOrder, isActive: true },
    });

    return member ? GoldKittyMemberEntity.fromModel(member) : null;
  }
}
