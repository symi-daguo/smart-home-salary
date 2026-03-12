import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AlertSeverity } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type CompareBreakdownItem = {
  productId: string;
  salesQty: number;
  installQty: number;
  diff: number;
};

type CompareResult = {
  projectId: string;
  salesTotalQty: number;
  installTotalQty: number;
  diffQty: number;
  diffRate: number;
  severity: AlertSeverity;
  breakdown: CompareBreakdownItem[];
};

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { projectId?: string; severity?: AlertSeverity; unresolved?: boolean }) {
    return this.prisma.alert.findMany({
      where: this.prisma.getTenantWhere({
        ...(params.projectId ? { projectId: params.projectId } : {}),
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.unresolved ? { resolvedAt: null } : {}),
      }),
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolve(id: string) {
    const row = await this.prisma.alert.findFirst({
      where: this.prisma.getTenantWhere({ id }),
    });
    if (!row) throw new NotFoundException('预警不存在');
    if (row.resolvedAt) return row;
    return this.prisma.alert.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }

  private calcDiffRate(salesTotal: number, installTotal: number) {
    const maxBase = Math.max(1, salesTotal, installTotal);
    return Math.abs(salesTotal - installTotal) / maxBase;
  }

  private severityByRate(rate: number): AlertSeverity {
    if (rate > 0.05) return AlertSeverity.CRITICAL;
    if (rate >= 0.03) return AlertSeverity.WARNING;
    return AlertSeverity.INFO;
  }

  private buildTitle(severity: AlertSeverity) {
    if (severity === AlertSeverity.CRITICAL) return '项目数据差异预警（红色）';
    if (severity === AlertSeverity.WARNING) return '项目数据差异预警（黄色）';
    return '项目数据差异提示';
  }

  private buildMessage(result: CompareResult) {
    const pct = (result.diffRate * 100).toFixed(2);
    return `销售数量=${result.salesTotalQty}，安装数量=${result.installTotalQty}，差异数量=${result.diffQty}，差异率=${pct}%`;
  }

  async compareAndCreateAlert(projectId: string): Promise<CompareResult> {
    const project = await this.prisma.project.findFirst({
      where: this.prisma.getTenantWhere({ id: projectId }),
      select: { id: true, name: true },
    });
    if (!project) throw new NotFoundException('项目不存在');

    const salesItems = await this.prisma.salesOrderItem.findMany({
      where: this.prisma.getTenantWhere({ salesOrder: { projectId } }),
      select: { productId: true, quantity: true },
    });

    const installItems = await this.prisma.installationRecord.findMany({
      where: this.prisma.getTenantWhere({ projectId }),
      select: { productId: true, quantity: true },
    });

    const salesMap = new Map<string, number>();
    for (const it of salesItems) salesMap.set(it.productId, (salesMap.get(it.productId) ?? 0) + it.quantity);

    const installMap = new Map<string, number>();
    for (const it of installItems)
      installMap.set(it.productId, (installMap.get(it.productId) ?? 0) + it.quantity);

    const productIds = new Set<string>([...salesMap.keys(), ...installMap.keys()]);
    const breakdown: CompareBreakdownItem[] = Array.from(productIds).map((productId) => {
      const salesQty = salesMap.get(productId) ?? 0;
      const installQty = installMap.get(productId) ?? 0;
      return { productId, salesQty, installQty, diff: salesQty - installQty };
    });

    const salesTotalQty = breakdown.reduce((sum, x) => sum + x.salesQty, 0);
    const installTotalQty = breakdown.reduce((sum, x) => sum + x.installQty, 0);
    const diffQty = Math.abs(salesTotalQty - installTotalQty);
    const diffRate = this.calcDiffRate(salesTotalQty, installTotalQty);
    const severity = this.severityByRate(diffRate);

    const result: CompareResult = {
      projectId,
      salesTotalQty,
      installTotalQty,
      diffQty,
      diffRate,
      severity,
      breakdown: breakdown.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
    };

    // MVP：每次运行都生成一条记录，便于审计追踪；后续可做去重/合并策略
    await this.prisma.alert.create({
      data: this.prisma.getTenantData({
        projectId,
        severity,
        title: this.buildTitle(severity),
        message: this.buildMessage(result),
        metadata: {
          projectName: project.name,
          ...result,
        },
      }),
    });

    return result;
  }

  async run(dto: { projectId?: string }) {
    if (!dto.projectId) {
      throw new BadRequestException('MVP 先要求传 projectId');
    }
    return this.compareAndCreateAlert(dto.projectId);
  }
}

