import { Injectable } from '@nestjs/common';
import { EmploymentStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardRevenueTrendPointDto } from './dto/dashboard-revenue-trend.dto';
import { DashboardInstallationBreakdownItemDto } from './dto/dashboard-installation-breakdown.dto';
import { DashboardRecentSalesItemDto } from './dto/dashboard-recent-sales.dto';
import { DashboardRecentInstallationItemDto } from './dto/dashboard-recent-installations.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [salesAgg, salesCount, activeEmployees, pendingAlerts] = await Promise.all([
      this.prisma.salesOrder.aggregate({
        _sum: { amount: true },
        where: this.prisma.getTenantWhere({
          occurredAt: { gte: monthStart, lte: now },
        }),
      }),
      this.prisma.salesOrder.count({
        where: this.prisma.getTenantWhere({
          occurredAt: { gte: monthStart, lte: now },
        }),
      }),
      this.prisma.employee.count({
        where: this.prisma.getTenantWhere({
          status: EmploymentStatus.ACTIVE,
        }),
      }),
      this.prisma.alert.count({
        where: this.prisma.getTenantWhere({
          resolvedAt: null,
        }),
      }),
    ]);

    const totalRevenueThisMonth =
      Number(salesAgg._sum.amount ?? 0);

    return {
      totalRevenueThisMonth,
      salesOrderCountThisMonth: salesCount,
      activeEmployeeCount: activeEmployees,
      pendingAlertCount: pendingAlerts,
    };
  }

  async getRevenueTrend(params?: { months?: number }): Promise<DashboardRevenueTrendPointDto[]> {
    const months = Math.min(Math.max(params?.months ?? 6, 1), 24);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const rows = await this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere({
        occurredAt: { gte: start, lt: endExclusive },
      }),
      select: { occurredAt: true, amount: true },
    });

    const map = new Map<string, number>();
    for (const r of rows) {
      const d = r.occurredAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + Number(r.amount));
    }

    const out: DashboardRevenueTrendPointDto[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ month: key, revenue: map.get(key) ?? 0 });
    }
    return out;
  }

  async getInstallationBreakdown(params?: { days?: number; limit?: number }): Promise<DashboardInstallationBreakdownItemDto[]> {
    const days = Math.min(Math.max(params?.days ?? 7, 1), 31);
    const limit = Math.min(Math.max(params?.limit ?? 6, 1), 20);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.prisma.installationRecord.findMany({
      where: this.prisma.getTenantWhere({
        occurredAt: { gte: since },
      }),
      select: {
        quantity: true,
        product: { select: { category: true } },
      },
    });

    const map = new Map<string, number>();
    for (const r of rows) {
      const cat = r.product.category;
      map.set(cat, (map.get(cat) ?? 0) + r.quantity);
    }

    const sorted = Array.from(map.entries())
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    const top = sorted.slice(0, limit);
    const rest = sorted.slice(limit);
    const restQty = rest.reduce((s, x) => s + x.quantity, 0);
    if (restQty > 0) top.push({ category: '其他', quantity: restQty });
    return top;
  }

  async getRecentSales(params?: { limit?: number }): Promise<DashboardRecentSalesItemDto[]> {
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 50);
    const rows = await this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { occurredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        project: { select: { name: true } },
        employee: { select: { name: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      projectName: r.project.name,
      employeeName: r.employee.name,
      amount: Number(r.amount),
      occurredAt: r.occurredAt.toISOString(),
    }));
  }

  async getRecentInstallations(params?: { limit?: number }): Promise<DashboardRecentInstallationItemDto[]> {
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 50);
    const rows = await this.prisma.installationRecord.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { occurredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        serviceType: true,
        quantity: true,
        occurredAt: true,
        product: { select: { name: true } },
        employee: { select: { name: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      productName: r.product.name,
      employeeName: r.employee.name,
      serviceType: r.serviceType,
      quantity: r.quantity,
      occurredAt: r.occurredAt.toISOString(),
    }));
  }
}

