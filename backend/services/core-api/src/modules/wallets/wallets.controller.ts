import { Controller, Get, Param } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { WalletsService } from './wallets.service';
import { WalletSummaryDto } from './dto/wallet-summary.dto';
import { WalletEntity } from './entities/wallet.entity';
import { WalletType } from '@prisma/client';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get(':userId')
  async getSummary(@Param('userId') userId: string): Promise<WalletSummaryDto> {
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
  async getWallet(@Param('userId') userId: string, @Param('type') type: WalletType): Promise<WalletEntity> {
    const wallet = await this.walletsService.findByUserAndType(userId, type);
    return plainToInstance(WalletEntity, wallet, { excludeExtraneousValues: true });
  }
}

