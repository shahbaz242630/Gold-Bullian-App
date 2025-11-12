import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';
import { KidsWalletsService } from './services/kids-wallets.service';
import { CreateKidAccountDto } from './dto/create-kid-account.dto';
import { UpdateKidAccountDto } from './dto/update-kid-account.dto';
import { TransferToKidDto } from './dto/transfer-to-kid.dto';

/**
 * Kids Wallets Controller
 *
 * RESTful API endpoints for Kids Wallets (Family Accounts) feature
 *
 * SECURITY: All endpoints include ownership verification to prevent unauthorized access
 */
@Controller('kids-wallets')
@UseGuards(SupabaseAuthGuard)
export class KidsWalletsController {
  constructor(
    private readonly kidsWalletsService: KidsWalletsService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== Kid Account Management ====================

  /**
   * POST /kids-wallets
   * Create a new kid account
   */
  @Post()
  async createKidAccount(@Body() dto: CreateKidAccountDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, dto.parentId);
    return this.kidsWalletsService.createKidAccount(dto);
  }

  /**
   * GET /kids-wallets/parent/:parentId
   * Get all kid accounts for a parent
   */
  @Get('parent/:parentId')
  async getKidAccounts(@Param('parentId') parentId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, parentId);
    return this.kidsWalletsService.getKidAccounts(parentId);
  }

  /**
   * GET /kids-wallets/:kidId
   * Get a specific kid account
   */
  @Get(':kidId')
  async getKidAccount(@Param('kidId') kidId: string, @Req() req: FastifyRequest) {
    await this.assertKidAccountAccess(req, kidId);
    return this.kidsWalletsService.getKidAccount(kidId);
  }

  /**
   * PATCH /kids-wallets/:kidId
   * Update kid account details
   */
  @Patch(':kidId')
  async updateKidAccount(
    @Param('kidId') kidId: string,
    @Body() dto: UpdateKidAccountDto,
    @Req() req: FastifyRequest,
  ) {
    await this.assertKidAccountAccess(req, kidId);
    return this.kidsWalletsService.updateKidAccount(kidId, dto);
  }

  // ==================== Family Dashboard ====================

  /**
   * GET /kids-wallets/family/:parentId
   * Get family dashboard (parent + all kids with balances)
   */
  @Get('family/:parentId')
  async getFamilyDashboard(@Param('parentId') parentId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, parentId);
    return this.kidsWalletsService.getFamilyDashboard(parentId);
  }

  // ==================== Transfers ====================

  /**
   * POST /kids-wallets/transfer
   * Transfer gold from parent to kid
   */
  @Post('transfer')
  async transferToKid(@Body() dto: TransferToKidDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, dto.parentId);
    return this.kidsWalletsService.transferToKid(dto);
  }

  /**
   * GET /kids-wallets/transfer-history/:parentId/:kidId
   * Get transfer history between parent and kid
   */
  @Get('transfer-history/:parentId/:kidId')
  async getTransferHistory(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string,
    @Req() req: FastifyRequest,
  ) {
    await this.assertOwnership(req, parentId);
    return this.kidsWalletsService.getTransferHistory(parentId, kidId);
  }

  // ==================== Security Helpers ====================

  /**
   * Verify user owns the specified userId (parent verification)
   */
  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('Cannot access another user\'s family accounts');
    }
  }

  /**
   * Verify user is the parent of the kid account
   */
  private async assertKidAccountAccess(req: FastifyRequest, kidId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const kidAccount = await this.kidsWalletsService.getKidAccount(kidId);

    // Verify the authenticated user is the parent of this kid account
    if (kidAccount.parentUserId !== user.id) {
      throw new ForbiddenException('Cannot access another parent\'s kid account');
    }
  }
}
