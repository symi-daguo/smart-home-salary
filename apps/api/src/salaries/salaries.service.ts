import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmploymentStatus, Prisma, SalaryStatus, ServiceType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type CommissionTier = { min: number; max: number | null; rate: number };
type DiscountRule = { discount: number; factor: number };

type CommissionRule = {
  type?: string;
  tiers?: CommissionTier[];
  discount_rules?: DiscountRule[];
};

function parseYearMonthRange(yearMonth: string) {
  const [y, m] = yearMonth.split('-').map((x) => Number(x));
  if (!y || !m || m < 1 || m > 12) throw new BadRequestException('yearMonth 格式错误');
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

function toNumber(d: any): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'number') return d;
  if (typeof d === 'string') return Number(d);
  if (typeof d?.toNumber === 'function') return d.toNumber();
  return Number(d);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class SalariesService {
  constructor(private readonly prisma: PrismaService) {}

  private getDiscountFactor(discountRate: number, rule?: CommissionRule) {
    // 需求基线：>=0.95 => 1.0；0.90-0.95 => 0.85；0.85-0.90 => 0.5；<0.85 => 0
    // 若岗位配置了 discount_rules，则按配置优先（从高到低匹配）
    const configured = rule?.discount_rules?.slice().sort((a, b) => b.discount - a.discount) ?? [];
    if (configured.length) {
      for (const r of configured) {
        if (discountRate >= r.discount) return r.factor;
      }
      return 0;
    }
    if (discountRate >= 0.95) return 1;
    if (discountRate >= 0.9) return 0.85;
    if (discountRate >= 0.85) return 0.5;
    return 0;
  }

  private pickTierRate(performance: number, rule?: CommissionRule) {
    const tiers = (rule?.tiers ?? [])
      .map((t) => ({ min: t.min, max: t.max ?? null, rate: t.rate }))
      .sort((a, b) => a.min - b.min);

    // 基线默认档位（需求文档）
    const fallback: CommissionTier[] = [
      { min: 0, max: 50000, rate: 0.03 },
      { min: 50000, max: 80000, rate: 0.04 },
      { min: 80000, max: 100000, rate: 0.05 },
      { min: 100000, max: null, rate: 0.06 },
    ];

    const list = tiers.length ? tiers : fallback;
    for (const t of list) {
      const inMin = performance >= t.min;
      const inMax = t.max === null ? true : performance < t.max;
      if (inMin && inMax) return t.rate;
    }
    return list[list.length - 1]?.rate ?? 0;
  }

  private feeByServiceType(serviceType: ServiceType, product: { installationFee: any; debuggingFee: any; otherFee: any }) {
    if (serviceType === ServiceType.INSTALL) return toNumber(product.installationFee);
    if (serviceType === ServiceType.DEBUG) return toNumber(product.debuggingFee) || toNumber(product.installationFee);
    // AFTER_SALES
    return toNumber(product.otherFee);
  }

  async settle(dto: { yearMonth: string; employeeIds?: string[]; penalties?: Record<string, number> }) {
    const { start, end } = parseYearMonthRange(dto.yearMonth);
    const penalties = dto.penalties ?? {};

    type EmployeeWithPosition = Prisma.EmployeeGetPayload<{ include: { position: true } }>;

    const employees: EmployeeWithPosition[] = await this.prisma.employee.findMany({
      where: this.prisma.getTenantWhere<Prisma.EmployeeWhereInput>({
        status: EmploymentStatus.ACTIVE,
        ...(dto.employeeIds?.length ? { id: { in: dto.employeeIds } } : {}),
      }),
      include: { position: true },
      orderBy: { createdAt: 'asc' },
    });

    const results = [];

    for (const emp of employees) {
      const commissionRule = (emp.position?.commissionRule ?? {}) as CommissionRule;

      const salesOrders = await this.prisma.salesOrder.findMany({
        where: this.prisma.getTenantWhere({
          employeeId: emp.id,
          verified: true,
          occurredAt: { gte: start, lt: end },
        }),
        select: { amount: true, discountRate: true, occurredAt: true },
      });

      let tierPerformance = 0;
      let specialDiscountAmount = 0;
      for (const o of salesOrders) {
        const amount = toNumber(o.amount);
        const discountRate = toNumber(o.discountRate);
        const factor = this.getDiscountFactor(discountRate, commissionRule);
        if (discountRate < 0.85) {
          // <0.85：不计入跳点累计，但提成减半（MVP 先按规则自动处理；特批/争议后续加状态）
          specialDiscountAmount += amount;
          continue;
        }
        tierPerformance += amount * factor;
      }

      const tierRate = this.pickTierRate(tierPerformance, commissionRule);
      const commissionFromTier = tierPerformance * tierRate;
      const commissionFromSpecial = specialDiscountAmount * 0.5 * tierRate;
      const salesCommission = round2(commissionFromTier + commissionFromSpecial);

      const techRecords = await this.prisma.installationRecord.findMany({
        where: this.prisma.getTenantWhere({
          employeeId: emp.id,
          occurredAt: { gte: start, lt: end },
        }),
        select: {
          serviceType: true,
          quantity: true,
          difficultyFactor: true,
          product: { select: { installationFee: true, debuggingFee: true, otherFee: true } },
        },
      });

      let technicalFee = 0;
      for (const r of techRecords) {
        const unit = this.feeByServiceType(r.serviceType, r.product);
        const qty = r.quantity;
        const diff = toNumber(r.difficultyFactor) || 1;
        technicalFee += unit * qty * diff;
      }
      technicalFee = round2(technicalFee);

      const baseSalary = round2(toNumber(emp.position?.baseSalary));
      const allowances = round2(
        toNumber(emp.position?.phoneAllowance) +
          toNumber(emp.position?.transportAllowance) +
          toNumber(emp.position?.otherAllowance),
      );

      const penalty = round2(toNumber(penalties[emp.id] ?? 0));
      const total = round2(baseSalary + salesCommission + technicalFee + allowances - penalty);

      const data: Prisma.SalaryUncheckedCreateInput = this.prisma.getTenantData({
        employeeId: emp.id,
        yearMonth: dto.yearMonth,
        baseSalary,
        salesCommission,
        tierCommission: 0,
        technicalFee,
        allowances,
        penalty,
        total,
        status: SalaryStatus.DRAFT,
        paidDate: undefined,
      });

      const salary = await this.prisma.salary.upsert({
        where: {
          tenantId_employeeId_yearMonth: {
            tenantId: data.tenantId,
            employeeId: emp.id,
            yearMonth: dto.yearMonth,
          },
        },
        create: data,
        update: {
          baseSalary: data.baseSalary,
          salesCommission: data.salesCommission,
          tierCommission: data.tierCommission,
          technicalFee: data.technicalFee,
          allowances: data.allowances,
          penalty: data.penalty,
          total: data.total,
          // 保持人工状态不被覆盖：若已 APPROVED/PAID，不自动回退为 DRAFT
          status: undefined,
          paidDate: undefined,
        },
      });

      results.push(salary);
    }

    return results;
  }

  async list(params: { yearMonth?: string; employeeId?: string; status?: SalaryStatus }) {
    return this.prisma.salary.findMany({
      where: this.prisma.getTenantWhere({
        ...(params.yearMonth ? { yearMonth: params.yearMonth } : {}),
        ...(params.employeeId ? { employeeId: params.employeeId } : {}),
        ...(params.status ? { status: params.status } : {}),
      }),
      orderBy: [{ yearMonth: 'desc' }, { createdAt: 'desc' }],
      include: { employee: { include: { position: true } } },
    });
  }

  async get(id: string) {
    const row = await this.prisma.salary.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: { employee: { include: { position: true } } },
    });
    if (!row) throw new NotFoundException('工资单不存在');
    return row;
  }

  async updateStatus(id: string, dto: { status: SalaryStatus; paidDate?: string }) {
    await this.get(id);
    if (dto.status === SalaryStatus.DRAFT) {
      throw new BadRequestException('不支持回退到 DRAFT');
    }
    const paidDate = dto.paidDate ? new Date(dto.paidDate) : undefined;
    return this.prisma.salary.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.status === SalaryStatus.PAID ? { paidDate: paidDate ?? new Date() } : {}),
      },
    });
  }
}

