import { AlertSeverity } from '@prisma/client';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  it('calculates diff rate and severity thresholds', async () => {
    const tenantId = 't1';
    const prisma: any = {
      getTenantWhere: (where: any = {}) => ({ ...where, tenantId }),
      getTenantData: (data: any) => ({ ...data, tenantId }),
      project: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', name: '项目A' }),
      },
      salesOrderItem: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 10 }]),
      },
      installationRecord: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 9 }]),
      },
      alert: {
        create: jest.fn().mockResolvedValue({ id: 'a1' }),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const svc = new AlertsService(prisma);
    const res = await svc.compareAndCreateAlert('p1');
    // diff = 1 / max(10,9) = 0.1 => CRITICAL
    expect(res.diffRate).toBeCloseTo(0.1, 6);
    expect(res.severity).toBe(AlertSeverity.CRITICAL);
    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
  });

  it('WARNING when diffRate in [0.03,0.05]', async () => {
    const tenantId = 't1';
    const prisma: any = {
      getTenantWhere: (where: any = {}) => ({ ...where, tenantId }),
      getTenantData: (data: any) => ({ ...data, tenantId }),
      project: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', name: '项目A' }) },
      salesOrderItem: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 100 }]),
      },
      installationRecord: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 97 }]),
      },
      alert: { create: jest.fn().mockResolvedValue({ id: 'a1' }) },
    };
    const svc = new AlertsService(prisma);
    const res = await svc.compareAndCreateAlert('p1');
    // |100-97|/100 = 0.03 => WARNING
    expect(res.diffRate).toBeCloseTo(0.03, 6);
    expect(res.severity).toBe(AlertSeverity.WARNING);
  });

  it('INFO when diffRate < 0.03', async () => {
    const tenantId = 't1';
    const prisma: any = {
      getTenantWhere: (where: any = {}) => ({ ...where, tenantId }),
      getTenantData: (data: any) => ({ ...data, tenantId }),
      project: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', name: '项目A' }) },
      salesOrderItem: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 100 }]),
      },
      installationRecord: {
        findMany: jest.fn().mockResolvedValue([{ productId: 'prd1', quantity: 99 }]),
      },
      alert: { create: jest.fn().mockResolvedValue({ id: 'a1' }) },
    };
    const svc = new AlertsService(prisma);
    const res = await svc.compareAndCreateAlert('p1');
    // |100-99|/100 = 0.01 => INFO
    expect(res.severity).toBe(AlertSeverity.INFO);
  });
});
