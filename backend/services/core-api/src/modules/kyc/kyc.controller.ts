import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FastifyRequest } from 'fastify';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { KycProfileEntity } from './entities/kyc-profile.entity';
import { KycService } from './kyc.service';

@Controller('kyc')
@UseGuards(SupabaseAuthGuard)
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':userId')
  async getProfile(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, userId);
    const profile = await this.kycService.getProfileByUserId(userId);
    return profile ? plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true }) : null;
  }

  @Post('submit')
  async submit(@Body() body: SubmitKycDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, body.userId);
    const profile = await this.kycService.submit(body);
    return plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true });
  }

  @Post('admin/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateStatus(@Body() body: UpdateKycStatusDto) {
    const profile = await this.kycService.updateStatus(body);
    return plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true });
  }

  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException();
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('You cannot access another user\'s KYC details.');
    }
  }
}

