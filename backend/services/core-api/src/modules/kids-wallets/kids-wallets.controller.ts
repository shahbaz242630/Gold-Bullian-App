import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { KidsWalletsService } from './services/kids-wallets.service';
import { CreateKidAccountDto } from './dto/create-kid-account.dto';
import { UpdateKidAccountDto } from './dto/update-kid-account.dto';
import { TransferToKidDto } from './dto/transfer-to-kid.dto';

/**
 * Kids Wallets Controller
 *
 * RESTful API endpoints for Kids Wallets (Family Accounts) feature
 */
@Controller('kids-wallets')
@UseGuards(AuthGuard)
export class KidsWalletsController {
  constructor(private readonly kidsWalletsService: KidsWalletsService) {}

  // ==================== Kid Account Management ====================

  /**
   * POST /kids-wallets
   * Create a new kid account
   */
  @Post()
  async createKidAccount(@Body() dto: CreateKidAccountDto) {
    return this.kidsWalletsService.createKidAccount(dto);
  }

  /**
   * GET /kids-wallets/parent/:parentId
   * Get all kid accounts for a parent
   */
  @Get('parent/:parentId')
  async getKidAccounts(@Param('parentId') parentId: string) {
    return this.kidsWalletsService.getKidAccounts(parentId);
  }

  /**
   * GET /kids-wallets/:kidId
   * Get a specific kid account
   */
  @Get(':kidId')
  async getKidAccount(@Param('kidId') kidId: string) {
    return this.kidsWalletsService.getKidAccount(kidId);
  }

  /**
   * PATCH /kids-wallets/:kidId
   * Update kid account details
   */
  @Patch(':kidId')
  async updateKidAccount(
    @Param('kidId') kidId: string,
    @Body() dto: UpdateKidAccountDto
  ) {
    return this.kidsWalletsService.updateKidAccount(kidId, dto);
  }

  // ==================== Family Dashboard ====================

  /**
   * GET /kids-wallets/family/:parentId
   * Get family dashboard (parent + all kids with balances)
   */
  @Get('family/:parentId')
  async getFamilyDashboard(@Param('parentId') parentId: string) {
    return this.kidsWalletsService.getFamilyDashboard(parentId);
  }

  // ==================== Transfers ====================

  /**
   * POST /kids-wallets/transfer
   * Transfer gold from parent to kid
   */
  @Post('transfer')
  async transferToKid(@Body() dto: TransferToKidDto) {
    return this.kidsWalletsService.transferToKid(dto);
  }

  /**
   * GET /kids-wallets/transfer-history/:parentId/:kidId
   * Get transfer history between parent and kid
   */
  @Get('transfer-history/:parentId/:kidId')
  async getTransferHistory(
    @Param('parentId') parentId: string,
    @Param('kidId') kidId: string
  ) {
    return this.kidsWalletsService.getTransferHistory(parentId, kidId);
  }
}
