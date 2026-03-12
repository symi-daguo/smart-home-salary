import { EmploymentStatus, SalaryStatus, ServiceType } from '@prisma/client';
import { SalariesService } from './salaries.service';

describe('SalariesService', () => {
  it('settles salaries with tier commission + discount factor + technical fee', async () => {
    const tenantId = 't1';
    const empId = 'e1';

    const prisma: any = {
      getTenantWhere: (where: any = {}) => ({ ...where, tenantId }),
      getTenantData: (data: any) => ({ ...data, tenantId }),
      employee: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: empId,
            status: EmploymentStatus.ACTIVE,
            position: {
              baseSalary: '5000',
              phoneAllowance: '200',
              transportAllowance: '300',
              otherAllowance: '0',
              commissionRule: {
                tiers: [
                  { min: 0, max: 50000, rate: 0.03 },
                  { min: 50000, max: 80000, rate: 0.04 },
                  { min: 80000, max: 100000, rate: 0.05 },
                  { min: 100000, max: null, rate: 0.06 },
                ],
                discount_rules: [
                  { discount: 0.95, factor: 1.0 },
                  { discount: 0.9, factor: 0.85 },
                  { discount: 0.85, factor: 0.5 },
                ],
              },
            },
          },
        ]),
      },
      salesOrder: {
        findMany: jest.fn().mockResolvedValue([
          { amount: '10000', discountRate: '0.9', occurredAt: new Date('2026-03-10T00:00:00.000Z') }, // factor 0.85 => 8500
          { amount: '10000', discountRate: '0.84', occurredAt: new Date('2026-03-11T00:00:00.000Z') }, // <0.85 special
        ]),
      },
      installationRecord: {
        findMany: jest.fn().mockResolvedValue([
          {
            serviceType: ServiceType.INSTALL,
            quantity: 10,
            difficultyFactor: '1.2',
            product: { installationFee: '50', debuggingFee: null, otherFee: null },
          },
        ]),
      },
      salary: {
        upsert: jest.fn().mockImplementation(async ({ create }: any) => create),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const svc = new SalariesService(prisma);
    const out = await svc.settle({ yearMonth: '2026-03' });

    expect(out).toHaveLength(1);
    const s = out[0];
    expect(s.tenantId).toBe(tenantId);
    expect(s.employeeId).toBe(empId);
    expect(s.yearMonth).toBe('2026-03');
    expect(s.baseSalary).toBe(5000);
    // tierPerformance=8500, tierRate=0.03 => 255; special=10000*0.5*0.03=150 => 405
    expect(s.salesCommission).toBe(405);
    // technicalFee=50*10*1.2=600
    expect(s.technicalFee).toBe(600);
    expect(s.allowances).toBe(500);
    expect(s.penalty).toBe(0);
    expect(s.total).toBe(6505);
    expect(s.status).toBe(SalaryStatus.DRAFT);
    expect(s.tierCommission).toBe(0);
  });
});

