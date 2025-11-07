import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
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
 */
@Controller('gold-kitty')
@UseGuards(SupabaseAuthGuard)
export class GoldKittyController {
  constructor(private readonly goldKittyService: GoldKittyService) {}

  // ==================== Kitty Management ====================

  /**
   * POST /gold-kitty
   * Create a new Gold Kitty group
   */
  @Post()
  async createKitty(@Body() dto: CreateGoldKittyDto) {
    return this.goldKittyService.createKitty(dto);
  }

  /**
   * GET /gold-kitty/:id
   * Get kitty details with members and stats
   */
  @Get(':id')
  async getKitty(@Param('id') id: string) {
    return this.goldKittyService.getKittyById(id);
  }

  /**
   * GET /gold-kitty/user/:userId
   * Get all kitties for a user (owned + member of)
   */
  @Get('user/:userId')
  async getUserKitties(@Param('userId') userId: string) {
    return this.goldKittyService.getUserKitties(userId);
  }

  /**
   * PATCH /gold-kitty/:id
   * Update kitty details
   */
  @Patch(':id')
  async updateKitty(
    @Param('id') id: string,
    @Body() dto: UpdateGoldKittyDto
  ) {
    return this.goldKittyService.updateKitty(id, dto);
  }

  /**
   * PATCH /gold-kitty/:id/pause
   * Pause a kitty
   */
  @Patch(':id/pause')
  async pauseKitty(@Param('id') id: string) {
    return this.goldKittyService.pauseKitty(id);
  }

  /**
   * PATCH /gold-kitty/:id/complete
   * Mark kitty as completed
   */
  @Patch(':id/complete')
  async completeKitty(@Param('id') id: string) {
    return this.goldKittyService.completeKitty(id);
  }

  // ==================== Member Management ====================

  /**
   * POST /gold-kitty/:id/members
   * Add a member to the kitty
   */
  @Post(':id/members')
  async addMember(@Body() dto: AddMemberDto) {
    return this.goldKittyService.addMember(dto);
  }

  /**
   * DELETE /gold-kitty/:id/members/:memberId
   * Remove a member from the kitty
   */
  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') kittyId: string,
    @Param('memberId') memberId: string
  ) {
    await this.goldKittyService.removeMember(kittyId, memberId);
    return { message: 'Member removed successfully' };
  }

  /**
   * GET /gold-kitty/:id/members
   * Get all members of a kitty
   */
  @Get(':id/members')
  async getMembers(@Param('id') kittyId: string) {
    return this.goldKittyService.getKittyMembers(kittyId);
  }

  // ==================== Contributions ====================

  /**
   * POST /gold-kitty/:id/contribute
   * Record a contribution for the current round
   *
   * Note: In production, this would integrate with payment gateway
   * and gold purchase service to convert AED to gold
   */
  @Post(':id/contribute')
  async contribute(@Body() dto: ContributeDto) {
    // TODO: Integrate with payment gateway to process payment
    // TODO: Convert AED to gold using pricing service
    // For now, using a placeholder gold amount
    const goldGrams = 1.5; // This would come from pricing service
    const transactionId = `TXN-${Date.now()}`; // From payment gateway

    return this.goldKittyService.contribute(dto, goldGrams, transactionId);
  }

  /**
   * GET /gold-kitty/:id/contributions/:round
   * Get all contributions for a specific round
   */
  @Get(':id/contributions/:round')
  async getRoundContributions(
    @Param('id') kittyId: string,
    @Param('round') round: string
  ) {
    return this.goldKittyService.getKittyContributions(kittyId, parseInt(round));
  }

  // ==================== Allocations ====================

  /**
   * POST /gold-kitty/:id/allocate
   * Allocate the pot to a member (admin/owner only)
   *
   * This distributes the collected gold from all members
   * to the designated member for this round
   */
  @Post(':id/allocate')
  async allocatePot(@Body() dto: AllocatePotDto) {
    return this.goldKittyService.allocatePot(dto);
  }

  /**
   * GET /gold-kitty/:id/allocations
   * Get allocation history for a kitty
   */
  @Get(':id/allocations')
  async getAllocations(@Param('id') kittyId: string) {
    return this.goldKittyService.getKittyAllocations(kittyId);
  }
}
