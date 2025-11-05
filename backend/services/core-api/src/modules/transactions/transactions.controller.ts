import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';
import { BuyGoldDto } from './dto/buy-gold.dto';
import { SellGoldDto } from './dto/sell-gold.dto';
import { WithdrawCashDto } from './dto/withdraw-cash.dto';
import { WithdrawPhysicalDto } from './dto/withdraw-physical.dto';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

type TransactionListResponse = TransactionEntity[];

@Controller('transactions')
@UseGuards(SupabaseAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async list(
    @Query('userId') userId: string,
    @Query('limit') limit: string | undefined,
    @Query('cursor') cursor: string | undefined,
    @Req() req: FastifyRequest,
  ): Promise<TransactionListResponse> {
    if (!userId) {
      throw new BadRequestException('userId query parameter is required');
    }

    await this.assertOwnership(req, userId);

    const parsedLimit = limit ? Number(limit) : 50;
    const result = await this.transactionsService.listByUser(userId, parsedLimit, cursor);
    return result.map((item) => plainToInstance(TransactionEntity, item, { excludeExtraneousValues: true }));
  }

  @Post('buy')
  async buy(@Body() body: BuyGoldDto, @Req() req: FastifyRequest) {
    if (body.goldGrams === undefined && body.fiatAmount === undefined) {
      throw new BadRequestException('Either goldGrams or fiatAmount must be provided.');
    }

    await this.assertOwnership(req, body.userId);
    const result = await this.transactionsService.buyGold(body);
    return this.toResponse(result.transaction);
  }

  @Post('sell')
  async sell(@Body() body: SellGoldDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, body.userId);
    const result = await this.transactionsService.sellGold(body);
    return this.toResponse(result.transaction);
  }

  @Post('withdraw/cash')
  async withdrawCash(@Body() body: WithdrawCashDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, body.userId);
    const result = await this.transactionsService.withdrawCash(body);
    return this.toResponse(result.transaction);
  }

  @Post('withdraw/physical')
  async withdrawPhysical(@Body() body: WithdrawPhysicalDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, body.userId);
    const result = await this.transactionsService.withdrawPhysical(body);
    return this.toResponse(result.transaction);
  }

  private toResponse(model: TransactionEntity) {
    return plainToInstance(TransactionEntity, model, { excludeExtraneousValues: true });
  }

  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('You cannot modify another user\'s transactions.');
    }
  }
}

