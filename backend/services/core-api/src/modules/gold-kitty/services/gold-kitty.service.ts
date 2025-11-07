import { Injectable, NotFoundException } from '@nestjs/common';
import { GoldKittyStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGoldKittyDto } from '../dto/create-gold-kitty.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { ContributeDto } from '../dto/contribute.dto';
import { AllocatePotDto } from '../dto/allocate-pot.dto';
import { UpdateGoldKittyDto } from '../dto/update-gold-kitty.dto';
import { GoldKittyEntity } from '../entities/gold-kitty.entity';
import { GoldKittyCreationService } from './gold-kitty-creation.service';
import { GoldKittyMemberService } from './gold-kitty-member.service';
import { GoldKittyContributionService } from './gold-kitty-contribution.service';
import { GoldKittyAllocationService } from './gold-kitty-allocation.service';

/**
 * Gold Kitty Service (Main Orchestrator)
 *
 * Coordinates all Gold Kitty operations by delegating to specialized services
 * Single Responsibility: Orchestration and high-level queries
 */
@Injectable()
export class GoldKittyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly creationService: GoldKittyCreationService,
    private readonly memberService: GoldKittyMemberService,
    private readonly contributionService: GoldKittyContributionService,
    private readonly allocationService: GoldKittyAllocationService,
  ) {}

  // ==================== Kitty Management ====================

  /**
   * Create a new Gold Kitty
   */
  async createKitty(dto: CreateGoldKittyDto) {
    return this.creationService.createKitty(dto);
  }

  /**
   * Get a kitty by ID with full details
   */
  async getKittyById(kittyId: string) {
    const kitty = await this.prisma.goldKitty.findUnique({
      where: { id: kittyId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { allocationOrder: 'asc' },
        },
        _count: {
          select: {
            contributions: true,
            allocations: true,
          },
        },
      },
    });

    if (!kitty) {
      throw new NotFoundException(`Kitty ${kittyId} not found`);
    }

    return kitty;
  }

  /**
   * Get all kitties for a user (owned + member of)
   */
  async getUserKitties(userId: string) {
    const [ownedKitties, memberKitties] = await Promise.all([
      // Kitties owned by user
      this.prisma.goldKitty.findMany({
        where: { ownerId: userId },
        include: {
          members: {
            where: { isActive: true },
          },
          _count: {
            select: { members: { where: { isActive: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Kitties where user is a member
      this.prisma.goldKittyMember.findMany({
        where: { userId, isActive: true },
        include: {
          kitty: {
            include: {
              owner: {
                select: { id: true, firstName: true, lastName: true },
              },
              _count: {
                select: { members: { where: { isActive: true } } },
              },
            },
          },
        },
      }),
    ]);

    return {
      owned: ownedKitties.map(GoldKittyEntity.fromModel),
      memberOf: memberKitties.map((m) => ({
        kitty: GoldKittyEntity.fromModel(m.kitty),
        membership: {
          memberId: m.id,
          allocationOrder: m.allocationOrder,
          hasReceivedPot: m.hasReceivedPot,
        },
      })),
    };
  }

  /**
   * Update kitty details
   */
  async updateKitty(kittyId: string, dto: UpdateGoldKittyDto) {
    const kitty = await this.prisma.goldKitty.update({
      where: { id: kittyId },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        metadata: dto.metadata as any,
      },
    });

    return GoldKittyEntity.fromModel(kitty);
  }

  /**
   * Pause a kitty
   */
  async pauseKitty(kittyId: string) {
    return this.updateKitty(kittyId, { status: GoldKittyStatus.PAUSED });
  }

  /**
   * Complete a kitty (all rounds finished)
   */
  async completeKitty(kittyId: string) {
    return this.updateKitty(kittyId, { status: GoldKittyStatus.COMPLETED });
  }

  // ==================== Member Management ====================

  /**
   * Add a member to the kitty
   */
  async addMember(dto: AddMemberDto) {
    return this.memberService.addMember(dto);
  }

  /**
   * Remove a member from the kitty
   */
  async removeMember(kittyId: string, memberId: string) {
    return this.memberService.removeMember(kittyId, memberId);
  }

  /**
   * Get all members of a kitty
   */
  async getKittyMembers(kittyId: string) {
    return this.memberService.getKittyMembers(kittyId);
  }

  // ==================== Contributions ====================

  /**
   * Record a contribution
   */
  async contribute(dto: ContributeDto, goldGrams: number, transactionId?: string) {
    return this.contributionService.recordContribution(dto, goldGrams, transactionId);
  }

  /**
   * Get contributions for a specific round
   */
  async getKittyContributions(kittyId: string, roundNumber: number) {
    return this.contributionService.getRoundContributions(kittyId, roundNumber);
  }

  // ==================== Allocations ====================

  /**
   * Allocate pot to a member
   */
  async allocatePot(dto: AllocatePotDto) {
    return this.allocationService.allocatePot(dto);
  }

  /**
   * Get all allocations for a kitty
   */
  async getKittyAllocations(kittyId: string) {
    return this.allocationService.getKittyAllocations(kittyId);
  }
}
