import { Controller, ForbiddenException, Get, Param, Req, UseGuards } from '@nestjs/common';
import { WalletType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';
import { WalletSummaryDto } from './dto/wallet-summary.dto';
import { WalletEntity } from './entities/wallet.entity';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(SupabaseAuthGuard)
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':userId')
  async getSummary(@Param('userId') userId: string, @Req() req: FastifyRequest): Promise<WalletSummaryDto> {
    await this.assertOwnership(req, userId);
    const wallets = await this.walletsService.findAllForUser(userId);
    return plainToInstance(
      WalletSummaryDto,
      {
        userId,
        wallets: wallets.map((wallet) => plainToInstance(WalletEntity, wallet, { excludeExtraneousValues: true })),
      },
      { excludeExtraneousValues: true },
    );
  }

  @Get(':userId/:type')
  async getWallet(
    @Param('userId') userId: string,
    @Param('type') type: WalletType,
    @Req() req: FastifyRequest,
  ): Promise<WalletEntity> {
    await this.assertOwnership(req, userId);
    const wallet = await this.walletsService.findByUserAndType(userId, type);
    return plainToInstance(WalletEntity, wallet, { excludeExtraneousValues: true });
  }

  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('You cannot access wallets for another user.');
    }
  }
}

