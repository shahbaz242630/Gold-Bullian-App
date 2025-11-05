import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { KycProfileEntity } from './entities/kyc-profile.entity';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get(':userId')
  async getProfile(@Param('userId') userId: string) {
    const profile = await this.kycService.getProfileByUserId(userId);
    return profile ? plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true }) : null;
  }

  @Post('submit')
  async submit(@Body() body: SubmitKycDto) {
    const profile = await this.kycService.submit(body);
    return plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true });
  }

  @Post('admin/status')
  async updateStatus(@Body() body: UpdateKycStatusDto) {
    const profile = await this.kycService.updateStatus(body);
    return plainToInstance(KycProfileEntity, profile, { excludeExtraneousValues: true });
  }
}

