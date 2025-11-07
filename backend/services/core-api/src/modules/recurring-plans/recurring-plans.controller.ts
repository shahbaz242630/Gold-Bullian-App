import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RecurringPlansService } from './services/recurring-plans.service';
import { RecurringPlanSchedulerService } from './services/recurring-plan-scheduler.service';
import { CreateRecurringPlanDto } from './dto/create-recurring-plan.dto';
import { UpdateRecurringPlanDto } from './dto/update-recurring-plan.dto';

/**
 * Recurring Plans Controller
 *
 * RESTful API endpoints for Recurring Savings Plans feature
 */
@Controller('recurring-plans')
@UseGuards(AuthGuard)
export class RecurringPlansController {
  constructor(
    private readonly recurringPlansService: RecurringPlansService,
    private readonly schedulerService: RecurringPlanSchedulerService,
  ) {}

  // ==================== Plan Management ====================

  /**
   * POST /recurring-plans
   * Create a new recurring savings plan
   */
  @Post()
  async createPlan(@Body() dto: CreateRecurringPlanDto) {
    return this.recurringPlansService.createPlan(dto);
  }

  /**
   * GET /recurring-plans/:id
   * Get plan details
   */
  @Get(':id')
  async getPlan(@Param('id') id: string) {
    return this.recurringPlansService.getPlanById(id);
  }

  /**
   * GET /recurring-plans/user/:userId
   * Get all plans for a user
   */
  @Get('user/:userId')
  async getUserPlans(@Param('userId') userId: string) {
    return this.recurringPlansService.getUserPlans(userId);
  }

  /**
   * PATCH /recurring-plans/:id
   * Update plan details
   */
  @Patch(':id')
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringPlanDto
  ) {
    return this.recurringPlansService.updatePlan(id, dto);
  }

  /**
   * PATCH /recurring-plans/:id/pause
   * Pause a plan
   */
  @Patch(':id/pause')
  async pausePlan(@Param('id') id: string) {
    return this.recurringPlansService.pausePlan(id);
  }

  /**
   * PATCH /recurring-plans/:id/resume
   * Resume a paused plan
   */
  @Patch(':id/resume')
  async resumePlan(@Param('id') id: string) {
    return this.recurringPlansService.resumePlan(id);
  }

  /**
   * DELETE /recurring-plans/:id
   * Cancel a plan
   */
  @Delete(':id')
  async cancelPlan(@Param('id') id: string) {
    await this.recurringPlansService.cancelPlan(id);
    return { message: 'Plan cancelled successfully' };
  }

  // ==================== Executions ====================

  /**
   * GET /recurring-plans/:id/executions
   * Get execution history for a plan
   */
  @Get(':id/executions')
  async getExecutions(@Param('id') planId: string) {
    return this.recurringPlansService.getPlanExecutions(planId);
  }

  /**
   * POST /recurring-plans/:id/execute
   * Manually execute a plan (for testing/admin)
   */
  @Post(':id/execute')
  async executePlan(@Param('id') planId: string) {
    return this.recurringPlansService.executePlanManually(planId);
  }

  // ==================== Progress ====================

  /**
   * GET /recurring-plans/:id/progress
   * Get progress towards goal
   */
  @Get(':id/progress')
  async getPlanProgress(@Param('id') planId: string) {
    return this.recurringPlansService.getPlanProgress(planId);
  }

  // ==================== Scheduler (Admin) ====================

  /**
   * POST /recurring-plans/scheduler/trigger
   * Manually trigger scheduler (admin/testing only)
   */
  @Post('scheduler/trigger')
  async triggerScheduler() {
    return this.schedulerService.manualTrigger();
  }
}
