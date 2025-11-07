import { describe, it, expect, beforeEach } from 'vitest';
import { RecurringPlanValidationService } from '../../../src/modules/recurring-plans/services/recurring-plan-validation.service';

describe('RecurringPlanValidationService', () => {
  let service: RecurringPlanValidationService;

  beforeEach(() => {
    service = new RecurringPlanValidationService();
  });

  describe('validatePlanCreation', () => {
    it('should accept valid plan parameters', () => {
      expect(() => {
        service.validatePlanCreation(50, 'MONTHLY' as any, 15, 500);
      }).not.toThrow();
    });

    it('should reject amount below minimum', () => {
      expect(() => {
        service.validatePlanCreation(5, 'MONTHLY' as any, 15);
      }).toThrow('Recurring amount must be at least 10 AED');
    });

    it('should reject invalid execution day for monthly', () => {
      expect(() => {
        service.validatePlanCreation(50, 'MONTHLY' as any, 35);
      }).toThrow('Execution day for monthly plan must be between 1-31');
    });

    it('should reject invalid execution day for weekly', () => {
      expect(() => {
        service.validatePlanCreation(50, 'WEEKLY' as any, 8);
      }).toThrow('Execution day for weekly plan must be between 1-7');
    });

    it('should reject goal amount less than recurring amount', () => {
      expect(() => {
        service.validatePlanCreation(100, 'MONTHLY' as any, 15, 50);
      }).toThrow('Goal amount must be greater than recurring amount');
    });
  });

  describe('validateCanPause', () => {
    it('should allow pausing active plan', () => {
      expect(service.validateCanPause('ACTIVE')).toBe(true);
    });

    it('should reject pausing completed plan', () => {
      expect(() => {
        service.validateCanPause('COMPLETED');
      }).toThrow('Cannot pause a completed plan');
    });

    it('should reject pausing cancelled plan', () => {
      expect(() => {
        service.validateCanPause('CANCELLED');
      }).toThrow('Cannot pause a cancelled plan');
    });
  });

  describe('validateCanResume', () => {
    it('should allow resuming paused plan', () => {
      expect(service.validateCanResume('PAUSED')).toBe(true);
    });

    it('should reject resuming non-paused plan', () => {
      expect(() => {
        service.validateCanResume('ACTIVE');
      }).toThrow('Can only resume paused plans');
    });
  });
});
