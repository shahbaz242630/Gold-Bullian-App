import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { NomineesController } from './nominees.controller';
import { NomineesService } from './nominees.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NomineesController],
  providers: [NomineesService],
  exports: [NomineesService],
})
export class NomineesModule {}

