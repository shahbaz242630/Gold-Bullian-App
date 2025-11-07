import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { PhysicalWithdrawalService } from './services/physical-withdrawal.service';
import { WithdrawPhysicalDto } from './dto/withdraw-physical-enhanced.dto';

/**
 * Physical Withdrawal Controller
 *
 * Enhanced endpoints for physical gold withdrawals with detailed options
 */
@Controller('transactions/physical-withdrawal')
@UseGuards(SupabaseAuthGuard)
export class PhysicalWithdrawalController {
  constructor(
    private readonly physicalWithdrawalService: PhysicalWithdrawalService,
  ) {}

  // ==================== User Endpoints ====================

  /**
   * POST /transactions/physical-withdrawal
   * Create a physical withdrawal request with enhanced details
   */
  @Post()
  async withdrawPhysical(@Body() dto: WithdrawPhysicalDto) {
    return this.physicalWithdrawalService.withdrawPhysical(dto);
  }

  /**
   * GET /transactions/physical-withdrawal/:transactionId
   * Get withdrawal details by transaction ID
   */
  @Get(':transactionId')
  async getWithdrawalDetails(@Param('transactionId') transactionId: string) {
    return this.physicalWithdrawalService.getWithdrawalDetails(transactionId);
  }

  // ==================== Admin Endpoints ====================

  /**
   * GET /transactions/physical-withdrawal/admin/pending
   * Get all pending withdrawals (admin only)
   */
  @Get('admin/pending')
  async getPendingWithdrawals() {
    return this.physicalWithdrawalService.getPendingWithdrawals();
  }

  /**
   * PATCH /transactions/physical-withdrawal/:transactionId/tracking
   * Update delivery tracking (admin/fulfillment partner)
   */
  @Patch(':transactionId/tracking')
  async updateTracking(
    @Param('transactionId') transactionId: string,
    @Body() body: { trackingNumber: string; estimatedDelivery?: string }
  ) {
    return this.physicalWithdrawalService.updateDeliveryTracking(
      transactionId,
      body.trackingNumber,
      body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined
    );
  }

  /**
   * PATCH /transactions/physical-withdrawal/:transactionId/delivered
   * Mark as delivered (admin/fulfillment partner)
   */
  @Patch(':transactionId/delivered')
  async markAsDelivered(@Param('transactionId') transactionId: string) {
    return this.physicalWithdrawalService.markAsDelivered(transactionId);
  }
}
