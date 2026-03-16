import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProjectDto, ProjectItemInput, UpdateProjectDto } from './dto/project.dto';

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
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: { q?: string; limit?: number }) {
    const q = params?.q?.trim();
    const limit = params?.limit;
    return this.prisma.project.findMany({
      where: this.prisma.getTenantWhere(
        q
          ? {
              name: { contains: q, mode: 'insensitive' as const },
            }
          : undefined,
      ),
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }

  async get(id: string) {
    const row = await this.prisma.project.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: { items: true },
    });
    if (!row) throw new NotFoundException('项目不存在');
    return row;
  }

  private async upsertItems(projectId: string, items: ProjectItemInput[] | undefined) {
    if (!items) return;
    const tenantWhere = this.prisma.getTenantWhere();
    // 先删再建，简单直观，便于和 Excel 导入模板对齐
    await this.prisma.projectItem.deleteMany({
      where: { ...tenantWhere, projectId },
    });
    if (!items.length) return;
    await this.prisma.projectItem.createMany({
      data: items.map((item) =>
        this.prisma.getTenantData({
          projectId,
          productId: item.productId,
          standardQuantity: item.standardQuantity,
          standardPrice: item.standardPrice ?? 0,
        }),
      ),
    });
  }

  async create(dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: this.prisma.getTenantData({
        name: dto.name,
        address: dto.address,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        contractAmount: dto.contractAmount,
        signDate: new Date(dto.signDate),
        status: dto.status ?? undefined,
      }),
    });
    await this.upsertItems(project.id, dto.items);
    return this.get(project.id);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.get(id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.customerName !== undefined ? { customerName: dto.customerName } : {}),
        ...(dto.customerPhone !== undefined ? { customerPhone: dto.customerPhone } : {}),
        ...(dto.contractAmount !== undefined ? { contractAmount: dto.contractAmount } : {}),
        ...(dto.signDate !== undefined ? { signDate: new Date(dto.signDate) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
    if (dto.items) {
      await this.upsertItems(project.id, dto.items);
    }
    return this.get(project.id);
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.projectItem.deleteMany({
      where: this.prisma.getTenantWhere({ projectId: id }),
    });
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }

  async getProjectStats(id: string) {
    const project = await this.prisma.project.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: {
        items: { include: { product: true } },
        salesOrders: { where: { verified: true } },
        warehouseOrders: {
          where: { orderType: 'OUTBOUND_SALES' },
          include: { items: { include: { product: true } } },
        },
        installationRecords: { include: { product: true } },
      },
    });
    if (!project) throw new NotFoundException('项目不存在');

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

    const installFee = project.installationRecords
      .filter((r) => r.serviceType === 'INSTALL')
      .reduce((sum, r) => sum + toNumber(r.product?.installationFee) * r.quantity, 0);
    const debugFee = project.installationRecords
      .filter((r) => r.serviceType === 'DEBUG')
      .reduce((sum, r) => sum + (toNumber(r.product?.debuggingFee) || toNumber(r.product?.installationFee)) * r.quantity, 0);

    let productDiscountRate = 1;
    if (outboundAmount - serviceFee > 0) {
      productDiscountRate = (salesAmount - serviceFee) / (outboundAmount - serviceFee);
    }

    let comprehensiveDiscountRate = 1;
    const totalForComprehensive = outboundAmount + installFee + debugFee;
    if (totalForComprehensive > 0) {
      comprehensiveDiscountRate = salesAmount / totalForComprehensive;
    }

    const originalReceivable = outboundAmount + installFee + debugFee;
    const discountedReceivable = outboundAmount * signDiscountRate + installFee + debugFee;

    return {
      projectId: project.id,
      projectName: project.name,
      serviceFee,
      signDiscountRate,
      salesAmount: round2(salesAmount),
      outboundAmount: round2(outboundAmount),
      installFee: round2(installFee),
      debugFee: round2(debugFee),
      productDiscountRate: round2(productDiscountRate),
      comprehensiveDiscountRate: round2(comprehensiveDiscountRate),
      originalReceivable: round2(originalReceivable),
      discountedReceivable: round2(discountedReceivable),
    };
  }
}

