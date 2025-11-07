import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PricingService } from '../pricing/pricing.service';
import { CreatePriceSnapshotDto } from '../pricing/dto/create-price-snapshot.dto';
import { UpsertPriceOverrideDto } from '../pricing/dto/upsert-price-override.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly pricingService: PricingService,
  ) {}

  // ==================== Pricing Management ====================

  @Post('pricing/snapshots')
  async createPriceSnapshot(@Body() dto: CreatePriceSnapshotDto) {
    const snapshot = await this.pricingService.recordSnapshot(dto);
    return {
      ...snapshot,
      buyPrice: snapshot.buyPrice.toString(),
      sellPrice: snapshot.sellPrice.toString(),
    };
  }

  @Post('pricing/overrides')
  async createPriceOverride(@Body() dto: UpsertPriceOverrideDto, @Req() req: FastifyRequest) {
    // Use the admin's ID from the authenticated user
    const adminId = req.user?.id || dto.adminId;
    const override = await this.pricingService.upsertOverride({
      ...dto,
      adminId,
    });

    return {
      ...override,
      buyPrice: override.buyPrice.toString(),
      sellPrice: override.sellPrice.toString(),
    };
  }

  @Get('pricing/snapshots')
  async getPriceSnapshots(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 50;
    const snapshots = await this.pricingService.listSnapshots(parsedLimit);
    return snapshots.map((snapshot) => ({
      ...snapshot,
      buyPrice: snapshot.buyPrice.toString(),
      sellPrice: snapshot.sellPrice.toString(),
    }));
  }

  // ==================== User Management ====================

  @Get('users')
  async listUsers(
    @Query('kycStatus') kycStatus?: string,
    @Query('email') email?: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.listUsers({
      kycStatus: kycStatus as any,
      email,
      phoneNumber,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return {
      ...result,
      users: result.users.map((user) => ({
        ...user,
        wallets: user.wallets.map((wallet) => ({
          ...wallet,
          balanceGrams: wallet.balanceGrams.toString(),
          lockedGrams: wallet.lockedGrams.toString(),
        })),
      })),
    };
  }

  @Get('users/:userId')
  async getUserDetails(@Param('userId') userId: string) {
    const user = await this.adminService.getUserById(userId);

    if (!user) {
      return null;
    }

    return {
      ...user,
      wallets: user.wallets.map((wallet) => ({
        ...wallet,
        balanceGrams: wallet.balanceGrams.toString(),
        lockedGrams: wallet.lockedGrams.toString(),
      })),
      transactions: user.transactions.map((txn) => ({
        ...txn,
        goldGrams: txn.goldGrams.toString(),
        fiatAmount: txn.fiatAmount.toString(),
        feeAmount: txn.feeAmount.toString(),
      })),
    };
  }

  // ==================== Transaction Management ====================

  @Get('transactions')
  async listTransactions(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.adminService.listAllTransactions({
      userId,
      status,
      type,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });

    return {
      ...result,
      transactions: result.transactions.map((txn) => ({
        ...txn,
        goldGrams: txn.goldGrams.toString(),
        fiatAmount: txn.fiatAmount.toString(),
        feeAmount: txn.feeAmount.toString(),
        wallet: txn.wallet
          ? {
              ...txn.wallet,
              balanceGrams: txn.wallet.balanceGrams.toString(),
              lockedGrams: txn.wallet.lockedGrams.toString(),
            }
          : null,
      })),
    };
  }

  // ==================== System Stats ====================

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }
}
