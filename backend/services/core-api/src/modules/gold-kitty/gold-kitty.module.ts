import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { GoldKittyController } from './gold-kitty.controller';
import { GoldKittyService } from './services/gold-kitty.service';
import { GoldKittyCreationService } from './services/gold-kitty-creation.service';
import { GoldKittyMemberService } from './services/gold-kitty-member.service';
import { GoldKittyContributionService } from './services/gold-kitty-contribution.service';
import { GoldKittyAllocationService } from './services/gold-kitty-allocation.service';
import { GoldKittyValidationService } from './services/gold-kitty-validation.service';

/**
 * Gold Kitty Module
 *
 * Enterprise-level modular architecture for Gold Kitty (Group Savings)
 *
 * Features:
 * - Group gold savings with rotating pot distribution
 * - Monthly contributions from all members
 * - Fair allocation based on pre-defined order
 * - Full audit trail of contributions and allocations
 *
 * Architecture:
 * - Specialized services with single responsibilities
 * - Clean separation of concerns
 * - Easy to test and debug
 * - Scalable and maintainable
 *
 * Security:
 * - Ownership verification on all endpoints
 * - Role-based access (owner vs member)
 */
@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [GoldKittyController],
  providers: [
    // Main orchestrator
    GoldKittyService,

    // Specialized services
    GoldKittyCreationService,
    GoldKittyMemberService,
    GoldKittyContributionService,
    GoldKittyAllocationService,
    GoldKittyValidationService,
  ],
  exports: [GoldKittyService],
})
export class GoldKittyModule {}
