import { Injectable } from '@nestjs/common';

import { AdminUsersService, AdminUserFilters } from './services/admin-users.service';
import { AdminTransactionsService, AdminTransactionFilters } from './services/admin-transactions.service';
import { AdminStatisticsService } from './services/admin-statistics.service';

export type { AdminUserFilters, AdminTransactionFilters };

/**
 * Main AdminService - delegates to specialized services
 * This facade pattern keeps the API stable while enabling better internal organization
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: AdminUsersService,
    private readonly transactionsService: AdminTransactionsService,
    private readonly statisticsService: AdminStatisticsService,
  ) {}

  async listUsers(filters: AdminUserFilters = {}) {
    return this.usersService.listUsers(filters);
  }

  async getUserById(userId: string) {
    return this.usersService.getUserById(userId);
  }

  async listAllTransactions(filters: AdminTransactionFilters = {}) {
    return this.transactionsService.listAllTransactions(filters);
  }

  async getSystemStats() {
    return this.statisticsService.getSystemStats();
  }
}
