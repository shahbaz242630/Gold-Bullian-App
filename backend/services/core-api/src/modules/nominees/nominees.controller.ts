import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UsersService } from '../users/users.service';
import { UpsertNomineeDto } from './dto/upsert-nominee.dto';
import { NomineeEntity } from './entities/nominee.entity';
import { NomineesService } from './nominees.service';

@Controller('nominees')
@UseGuards(SupabaseAuthGuard)
export class NomineesController {
  constructor(
    private readonly nomineesService: NomineesService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':userId')
  async getNominee(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, userId);
    const nominee = await this.nomineesService.getByUserId(userId);
    return nominee ? plainToInstance(NomineeEntity, nominee, { excludeExtraneousValues: true }) : null;
  }

  @Post()
  async upsert(@Body() body: UpsertNomineeDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, body.userId);
    const nominee = await this.nomineesService.upsert(body);
    return plainToInstance(NomineeEntity, nominee, { excludeExtraneousValues: true });
  }

  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('You cannot manage another user\'s nominee.');
    }
  }
}

