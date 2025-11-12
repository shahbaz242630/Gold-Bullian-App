import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';
import { GoldKittyService } from './services/gold-kitty.service';
import { CreateGoldKittyDto } from './dto/create-gold-kitty.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ContributeDto } from './dto/contribute.dto';
import { AllocatePotDto } from './dto/allocate-pot.dto';
import { UpdateGoldKittyDto } from './dto/update-gold-kitty.dto';

/**
 * Gold Kitty Controller
 *
 * RESTful API endpoints for Gold Kitty (Group Savings) feature
 *
 * SECURITY: All endpoints include ownership verification to prevent unauthorized access
 */
@Controller('gold-kitty')
@UseGuards(SupabaseAuthGuard)
export class GoldKittyController {
  constructor(
    private readonly goldKittyService: GoldKittyService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== Kitty Management ====================

  /**
   * POST /gold-kitty
   * Create a new Gold Kitty group
   */
  @Post()
  async createKitty(@Body() dto: CreateGoldKittyDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, dto.ownerId);
    return this.goldKittyService.createKitty(dto);
  }

  /**
   * GET /gold-kitty/:id
   * Get kitty details with members and stats
   */
  @Get(':id')
  async getKitty(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertKittyAccess(req, id);
    return this.goldKittyService.getKittyById(id);
  }

  /**
   * GET /gold-kitty/user/:userId
   * Get all kitties for a user (owned + member of)
   */
  @Get('user/:userId')
  async getUserKitties(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, userId);
    return this.goldKittyService.getUserKitties(userId);
  }

  /**
   * PATCH /gold-kitty/:id
   * Update kitty details (owner only)
   */
  @Patch(':id')
  async updateKitty(
    @Param('id') id: string,
    @Body() dto: UpdateGoldKittyDto,
    @Req() req: FastifyRequest,
  ) {
    await this.assertKittyOwner(req, id);
    return this.goldKittyService.updateKitty(id, dto);
  }

  /**
   * PATCH /gold-kitty/:id/pause
   * Pause a kitty (owner only)
   */
  @Patch(':id/pause')
  async pauseKitty(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertKittyOwner(req, id);
    return this.goldKittyService.pauseKitty(id);
  }

  /**
   * PATCH /gold-kitty/:id/complete
   * Mark kitty as completed (owner only)
   */
  @Patch(':id/complete')
  async completeKitty(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertKittyOwner(req, id);
    return this.goldKittyService.completeKitty(id);
  }

  // ==================== Member Management ====================

  /**
   * POST /gold-kitty/:id/members
   * Add a member to the kitty (owner only)
   */
  @Post(':id/members')
  async addMember(@Body() dto: AddMemberDto, @Req() req: FastifyRequest) {
    await this.assertKittyOwner(req, dto.kittyId);
    return this.goldKittyService.addMember(dto);
  }

  /**
   * DELETE /gold-kitty/:id/members/:memberId
   * Remove a member from the kitty (owner only)
   */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') kittyId: string,
    @Param('memberId') memberId: string,
    @Req() req: FastifyRequest,
  ) {
    await this.assertKittyOwner(req, kittyId);
    await this.goldKittyService.removeMember(kittyId, memberId);
    return { message: 'Member removed successfully' };
  }

  /**
   * GET /gold-kitty/:id/members
   * Get all members of a kitty (owner or member)
   */
  @Get(':id/members')
  async getMembers(@Param('id') kittyId: string, @Req() req: FastifyRequest) {
    await this.assertKittyAccess(req, kittyId);
    return this.goldKittyService.getKittyMembers(kittyId);
  }

  // ==================== Contributions ====================

  /**
   * POST /gold-kitty/:id/contribute
   * Record a contribution for the current round (members only)
   *
   * Note: In production, this would integrate with payment gateway
   * and gold purchase service to convert AED to gold
   */
  @Post(':id/contribute')
  async contribute(@Body() dto: ContributeDto, @Req() req: FastifyRequest) {
    await this.assertKittyMember(req, dto.kittyId);
    // TODO: Integrate with payment gateway to process payment
    // TODO: Convert AED to gold using pricing service
    // For now, using a placeholder gold amount
    const goldGrams = 1.5; // This would come from pricing service
    const transactionId = `TXN-${Date.now()}`; // From payment gateway

    return this.goldKittyService.contribute(dto, goldGrams, transactionId);
  }

  /**
   * GET /gold-kitty/:id/contributions/:round
   * Get all contributions for a specific round (owner or member)
   */
  @Get(':id/contributions/:round')
  async getRoundContributions(
    @Param('id') kittyId: string,
    @Param('round') round: string,
    @Req() req: FastifyRequest,
  ) {
    await this.assertKittyAccess(req, kittyId);
    return this.goldKittyService.getKittyContributions(kittyId, parseInt(round));
  }

  // ==================== Allocations ====================

  /**
   * POST /gold-kitty/:id/allocate
   * Allocate the pot to a member (owner only)
   *
   * This distributes the collected gold from all members
   * to the designated member for this round
   */
  @Post(':id/allocate')
  async allocatePot(@Body() dto: AllocatePotDto, @Req() req: FastifyRequest) {
    await this.assertKittyOwner(req, dto.kittyId);
    return this.goldKittyService.allocatePot(dto);
  }

  /**
   * GET /gold-kitty/:id/allocations
   * Get allocation history for a kitty (owner or member)
   */
  @Get(':id/allocations')
  async getAllocations(@Param('id') kittyId: string, @Req() req: FastifyRequest) {
    await this.assertKittyAccess(req, kittyId);
    return this.goldKittyService.getKittyAllocations(kittyId);
  }

  // ==================== Security Helpers ====================

  /**
   * Verify user owns the specified userId
   */
  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('Cannot access another user\'s resources');
    }
  }

  /**
   * Verify user is the owner of the kitty
   */
  private async assertKittyOwner(req: FastifyRequest, kittyId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const kitty = await this.goldKittyService.getKittyById(kittyId);
    if (kitty.ownerId !== user.id) {
      throw new ForbiddenException('Only the kitty owner can perform this action');
    }
  }

  /**
   * Verify user has access to the kitty (owner or member)
   */
  private async assertKittyAccess(req: FastifyRequest, kittyId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const kitty = await this.goldKittyService.getKittyById(kittyId);

    // Check if user is owner
    if (kitty.ownerId === user.id) {
      return;
    }

    // Check if user is an active member
    const isMember = kitty.members?.some(
      (member: any) => member.userId === user.id && member.isActive
    );

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this kitty');
    }
  }

  /**
   * Verify user is a member of the kitty
   */
  private async assertKittyMember(req: FastifyRequest, kittyId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const kitty = await this.goldKittyService.getKittyById(kittyId);

    // Check if user is an active member (including owner)
    const isMemberOrOwner = kitty.ownerId === user.id || kitty.members?.some(
      (member: any) => member.userId === user.id && member.isActive
    );

    if (!isMemberOrOwner) {
      throw new ForbiddenException('You must be a member of this kitty to contribute');
    }
  }
}
