import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { RecurringPlansService } from './services/recurring-plans.service';
import { RecurringPlanSchedulerService } from './services/recurring-plan-scheduler.service';
import { CreateRecurringPlanDto } from './dto/create-recurring-plan.dto';
import { UpdateRecurringPlanDto } from './dto/update-recurring-plan.dto';

/**
 * Recurring Plans Controller
 *
 * RESTful API endpoints for Recurring Savings Plans feature
 *
 * SECURITY: All endpoints include ownership verification to prevent unauthorized access
 */
@Controller('recurring-plans')
@UseGuards(SupabaseAuthGuard)
export class RecurringPlansController {
  constructor(
    private readonly recurringPlansService: RecurringPlansService,
    private readonly schedulerService: RecurringPlanSchedulerService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== Plan Management ====================

  /**
   * POST /recurring-plans
   * Create a new recurring savings plan
   */
  @Post()
  async createPlan(@Body() dto: CreateRecurringPlanDto, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, dto.userId);
    return this.recurringPlansService.createPlan(dto);
  }

  /**
   * GET /recurring-plans/:id
   * Get plan details
   */
  @Get(':id')
  async getPlan(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, id);
    return this.recurringPlansService.getPlanById(id);
  }

  /**
   * GET /recurring-plans/user/:userId
   * Get all plans for a user
   */
  @Get('user/:userId')
  async getUserPlans(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    await this.assertOwnership(req, userId);
    return this.recurringPlansService.getUserPlans(userId);
  }

  /**
   * PATCH /recurring-plans/:id
   * Update plan details
   */
  @Patch(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringPlanDto,
    @Req() req: FastifyRequest,
  ) {
    await this.assertPlanOwnership(req, id);
    return this.recurringPlansService.updatePlan(id, dto);
  }

  /**
   * PATCH /recurring-plans/:id/pause
   * Pause a plan
   */
  @Patch(':id/pause')
  async pausePlan(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, id);
    return this.recurringPlansService.pausePlan(id);
  }

  /**
   * PATCH /recurring-plans/:id/resume
   * Resume a paused plan
   */
  @Patch(':id/resume')
  async resumePlan(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, id);
    return this.recurringPlansService.resumePlan(id);
  }

  /**
   * DELETE /recurring-plans/:id
   * Cancel a plan
   */
  @Delete(':id')
  async cancelPlan(@Param('id') id: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, id);
    await this.recurringPlansService.cancelPlan(id);
    return { message: 'Plan cancelled successfully' };
  }

  // ==================== Executions ====================

  /**
   * GET /recurring-plans/:id/executions
   * Get execution history for a plan
   */
  @Get(':id/executions')
  async getExecutions(@Param('id') planId: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, planId);
    return this.recurringPlansService.getPlanExecutions(planId);
  }

  /**
   * POST /recurring-plans/:id/execute
   * Manually execute a plan (for testing/admin)
   */
  @Post(':id/execute')
  async executePlan(@Param('id') planId: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, planId);
    return this.recurringPlansService.executePlanManually(planId);
  }

  // ==================== Progress ====================

  /**
   * GET /recurring-plans/:id/progress
   * Get progress towards goal
   */
  @Get(':id/progress')
  async getPlanProgress(@Param('id') planId: string, @Req() req: FastifyRequest) {
    await this.assertPlanOwnership(req, planId);
    return this.recurringPlansService.getPlanProgress(planId);
  }

  // ==================== Scheduler (Admin) ====================

  /**
   * POST /recurring-plans/scheduler/trigger
   * Manually trigger scheduler (admin only)
   */
  @Post('scheduler/trigger')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async triggerScheduler() {
    return this.schedulerService.manualTrigger();
  }

  // ==================== Security Helpers ====================

  /**
   * Verify user owns the specified userId
   */
  private async assertOwnership(req: FastifyRequest, userId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user || user.id !== userId) {
      throw new ForbiddenException('Cannot access another user\'s resources');
    }
  }

  /**
   * Verify user owns the specified plan
   */
  private async assertPlanOwnership(req: FastifyRequest, planId: string) {
    const supabaseUid = req?.user?.id;
    if (!supabaseUid) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findBySupabaseUid(supabaseUid);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const plan = await this.recurringPlansService.getPlanById(planId);
    if (plan.userId !== user.id) {
      throw new ForbiddenException('Cannot access another user\'s recurring plan');
    }
  }
}
