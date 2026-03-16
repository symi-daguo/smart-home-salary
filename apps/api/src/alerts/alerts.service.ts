import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AlertSeverity, AlertType, ProductStatus, ProjectStatus } from '@prisma/client';
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

function toNumber(d: any): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === 'number') return d;
  if (typeof d === 'string') return Number(d);
  if (typeof d?.toNumber === 'function') return d.toNumber();
  return Number(d);
}

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

  async checkStockAlerts() {
    const products = await this.prisma.product.findMany({
      where: this.prisma.getTenantWhere({ status: ProductStatus.ACTIVE }),
      include: { inventory: true },
    });

    const alerts: any[] = [];

    for (const product of products) {
      const stock = product.inventory?.quantity ?? 0;
      const suggested = product.suggestedStockQty ?? 0;

      if (suggested > 0 && stock < suggested) {
        const severity = stock === 0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
        const alert = await this.prisma.alert.create({
          data: this.prisma.getTenantData({
            alertType: AlertType.INVENTORY,
            severity,
            title: `库存不足预警：${product.name}`,
            message: `产品「${product.name}」当前库存 ${stock}，低于建议库存 ${suggested}`,
            metadata: {
              productId: product.id,
              productName: product.name,
              currentStock: stock,
              suggestedStock: suggested,
            },
          }),
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async checkDiscountRateAlerts() {
    const projects = await this.prisma.project.findMany({
      where: this.prisma.getTenantWhere({ status: ProjectStatus.DONE }),
      include: {
        salesOrders: { where: { verified: true } },
        warehouseOrders: {
          where: { orderType: 'OUTBOUND_SALES' },
          include: { items: { include: { product: true } } },
        },
      },
    });

    const alerts: any[] = [];

    for (const project of projects) {
      const serviceFee = toNumber(project.serviceFee) || 0;
      const signDiscountRate = toNumber(project.signDiscountRate) || 1;

      const salesAmount = project.salesOrders.reduce(
        (sum, order) => sum + toNumber(order.amount),
        0,
      );

      const outboundAmount = project.warehouseOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce(
            (itemSum, item) =>
              itemSum + toNumber(item.product?.standardPrice) * item.quantity,
            0,
          ),
        0,
      );

      let productDiscountRate = 1;
      if (outboundAmount - serviceFee > 0) {
        productDiscountRate = (salesAmount - serviceFee) / (outboundAmount - serviceFee);
      }

      if (productDiscountRate < 0.85) {
        const alert = await this.prisma.alert.create({
          data: this.prisma.getTenantData({
            projectId: project.id,
            alertType: AlertType.SALES,
            severity: AlertSeverity.WARNING,
            title: `折扣率过低预警：${project.name}`,
            message: `项目「${project.name}」产品折扣率 ${(productDiscountRate * 100).toFixed(2)}%，低于85%`,
            metadata: {
              projectName: project.name,
              productDiscountRate,
              salesAmount,
              outboundAmount,
              serviceFee,
            },
          }),
        });
        alerts.push(alert);
      }

      if (signDiscountRate && productDiscountRate < signDiscountRate) {
        const alert = await this.prisma.alert.create({
          data: this.prisma.getTenantData({
            projectId: project.id,
            alertType: AlertType.SALES,
            severity: AlertSeverity.INFO,
            title: `折扣率低于签单折扣率：${project.name}`,
            message: `项目「${project.name}」产品折扣率 ${(productDiscountRate * 100).toFixed(2)}%，低于签单折扣率 ${(signDiscountRate * 100).toFixed(2)}%`,
            metadata: {
              projectName: project.name,
              productDiscountRate,
              signDiscountRate,
            },
          }),
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async checkPaymentBelowOutbound() {
    const projects = await this.prisma.project.findMany({
      where: this.prisma.getTenantWhere(),
      include: {
        salesOrders: { where: { verified: true } },
        warehouseOrders: {
          where: { orderType: 'OUTBOUND_SALES' },
          include: { items: { include: { product: true } } },
        },
      },
    });

    const alerts: any[] = [];

    for (const project of projects) {
      const salesAmount = project.salesOrders.reduce(
        (sum, order) => sum + toNumber(order.amount),
        0,
      );

      const outboundAmount = project.warehouseOrders.reduce(
        (sum, order) =>
          sum +
          order.items.reduce(
            (itemSum, item) =>
              itemSum + toNumber(item.unitPrice || item.product?.standardPrice) * item.quantity,
            0,
          ),
        0,
      );

      if (salesAmount < outboundAmount) {
        const alert = await this.prisma.alert.create({
          data: this.prisma.getTenantData({
            projectId: project.id,
            alertType: AlertType.SALES,
            severity: AlertSeverity.WARNING,
            title: `收款不足预警：${project.name}`,
            message: `项目「${project.name}」已收款 ${salesAmount.toFixed(2)}，低于出库金额 ${outboundAmount.toFixed(2)}`,
            metadata: {
              projectName: project.name,
              salesAmount,
              outboundAmount,
              diff: outboundAmount - salesAmount,
            },
          }),
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  async runAllAlerts() {
    const [stockAlerts, discountAlerts, paymentAlerts] = await Promise.all([
      this.checkStockAlerts(),
      this.checkDiscountRateAlerts(),
      this.checkPaymentBelowOutbound(),
    ]);

    return {
      stockAlerts: stockAlerts.length,
      discountAlerts: discountAlerts.length,
      paymentAlerts: paymentAlerts.length,
      total: stockAlerts.length + discountAlerts.length + paymentAlerts.length,
    };
  }
}

