import { describe, expect, it, vi } from 'vitest';
import { KycStatus } from '@prisma/client';

import { KycController } from '../../src/modules/kyc/kyc.controller';
import { KycService } from '../../src/modules/kyc/kyc.service';
import { SubmitKycDto } from '../../src/modules/kyc/dto/submit-kyc.dto';

const mockProfile = {
  id: 'kyc-1',
  userId: 'user-1',
  provider: 'digitify',
  providerRef: 'ref-123',
  status: KycStatus.IN_REVIEW,
  submittedAt: new Date(),
  reviewedAt: null,
  reviewerId: null,
  notes: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('KycController', () => {
  it('submits kyc via service', async () => {
    const service = {
      submit: vi.fn().mockResolvedValue(mockProfile),
      getProfileByUserId: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as KycService;

    const controller = new KycController(service);
    const payload: SubmitKycDto = {
      userId: 'user-1',
      provider: 'digitify',
      providerRef: 'ref-123',
    };

    const response = await controller.submit(payload);

    expect(response.userId).toBe('user-1');
    expect((service.submit as any)).toHaveBeenCalledWith(payload);
  });
});
