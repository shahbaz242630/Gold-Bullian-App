import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { TransactionEntity } from './entities/transaction.entity';
import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';
import { WithdrawCashDto } from './dto/withdraw-cash.dto';
import { WithdrawPhysicalDto } from './dto/withdraw-physical.dto';
import { TransactionsService } from './transactions.service';

type TransactionListResponse = TransactionEntity[];

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<TransactionListResponse> {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    const parsedLimit = limit ? Number(limit) : 50;
    const result = await this.transactionsService.listByUser(userId, parsedLimit, cursor);
    return result.map((item) => plainToInstance(TransactionEntity, item, { excludeExtraneousValues: true }));
  }

  @Post('buy')
  async buy(@Body() body: BuyGoldDto) {
    if (body.goldGrams === undefined && body.fiatAmount === undefined) {
      throw new BadRequestException('Either goldGrams or fiatAmount must be provided.');
    }

    const result = await this.transactionsService.buyGold(body);
    return this.toResponse(result.transaction);
  }

  @Post('sell')
  async sell(@Body() body: SellGoldDto) {
    const result = await this.transactionsService.sellGold(body);
    return this.toResponse(result.transaction);
  }

  @Post('withdraw/cash')
  async withdrawCash(@Body() body: WithdrawCashDto) {
    const result = await this.transactionsService.withdrawCash(body);
    return this.toResponse(result.transaction);
  }

  @Post('withdraw/physical')
  async withdrawPhysical(@Body() body: WithdrawPhysicalDto) {
    const result = await this.transactionsService.withdrawPhysical(body);
    return this.toResponse(result.transaction);
  }

  private toResponse(model: TransactionEntity) {
    return plainToInstance(TransactionEntity, model, { excludeExtraneousValues: true });
  }
}

