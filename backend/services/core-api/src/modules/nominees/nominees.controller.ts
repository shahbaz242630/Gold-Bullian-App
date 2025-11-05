import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { NomineesService } from './nominees.service';
import { UpsertNomineeDto } from './dto/upsert-nominee.dto';
import { NomineeEntity } from './entities/nominee.entity';

@Controller('nominees')
export class NomineesController {
  constructor(private readonly nomineesService: NomineesService) {}

  @Get(':userId')
  async getNominee(@Param('userId') userId: string) {
    const nominee = await this.nomineesService.getByUserId(userId);
    return nominee ? plainToInstance(NomineeEntity, nominee, { excludeExtraneousValues: true }) : null;
  }

  @Post()
  async upsert(@Body() body: UpsertNomineeDto) {
    const nominee = await this.nomineesService.upsert(body);
    return plainToInstance(NomineeEntity, nominee, { excludeExtraneousValues: true });
  }
}

