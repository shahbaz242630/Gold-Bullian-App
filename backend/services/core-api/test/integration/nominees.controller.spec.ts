import { describe, expect, it, vi } from 'vitest';

import { NomineesController } from '../../src/modules/nominees/nominees.controller';
import { NomineesService } from '../../src/modules/nominees/nominees.service';
import { UpsertNomineeDto } from '../../src/modules/nominees/dto/upsert-nominee.dto';

const nominee = {
  id: 'nom-1',
  userId: 'user-1',
  fullName: 'John Doe',
  relationship: 'Brother',
  email: 'john@example.com',
  phoneNumber: '+971500000000',
  countryCode: 'AE',
  documents: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NomineesController', () => {
  it('upserts nominee via service', async () => {
    const service = {
      upsert: vi.fn().mockResolvedValue(nominee),
      getByUserId: vi.fn(),
    } as unknown as NomineesService;

    const controller = new NomineesController(service);
    const payload: UpsertNomineeDto = {
      userId: 'user-1',
      fullName: 'John Doe',
      relationship: 'Brother',
    };

    const response = await controller.upsert(payload);

    expect(response.fullName).toBe('John Doe');
    expect((service.upsert as any)).toHaveBeenCalledWith(payload);
  });
});
