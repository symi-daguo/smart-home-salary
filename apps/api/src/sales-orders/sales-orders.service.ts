import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateSalesOrderDto, SalesOrderItemInput, UpdateSalesOrderDto } from './dto/sales-order.dto';

@Injectable()
export class SalesOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere(),
      include: {
        employee: true,
        project: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForEmployee(employeeId: string) {
    return this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere({ employeeId }),
      include: {
        employee: true,
        project: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.salesOrder.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: {
        employee: true,
        project: true,
        items: true,
      },
    });
    if (!row) throw new NotFoundException('销售订单不存在');
    return row;
  }

  private mapPaymentProofUrls(urls: string[] | undefined) {
    if (!urls) return undefined;
    return urls;
  }

  private async upsertItems(orderId: string, items: SalesOrderItemInput[] | undefined) {
    if (!items) return;
    const tenantWhere = this.prisma.getTenantWhere();
    await this.prisma.salesOrderItem.deleteMany({
      where: { ...tenantWhere, salesOrderId: orderId },
    });
    if (!items.length) return;
    await this.prisma.salesOrderItem.createMany({
      data: items.map((item) =>
        this.prisma.getTenantData({
          salesOrderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          standardPrice: item.standardPrice ?? null,
        }),
      ),
    });
  }

  async create(dto: CreateSalesOrderDto) {
    const order = await this.prisma.salesOrder.create({
      data: this.prisma.getTenantData({
        projectId: dto.projectId,
        employeeId: dto.employeeId,
        amount: dto.amount,
        discountRate: dto.discountRate,
        paymentProofUrls: this.mapPaymentProofUrls(dto.paymentProofUrls),
        remark: dto.remark ?? undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        verified: dto.verified ?? false,
      }),
    });
    await this.upsertItems(order.id, dto.items);
    return this.get(order.id);
  }

  async createForEmployee(employeeId: string, dto: Omit<CreateSalesOrderDto, 'employeeId'>) {
    return this.create({ ...dto, employeeId });
  }

  async update(id: string, dto: UpdateSalesOrderDto) {
    await this.get(id);
    const order = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.discountRate !== undefined ? { discountRate: dto.discountRate } : {}),
        ...(dto.paymentProofUrls !== undefined
          ? { paymentProofUrls: this.mapPaymentProofUrls(dto.paymentProofUrls ?? undefined) }
          : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark } : {}),
        ...(dto.occurredAt !== undefined ? { occurredAt: new Date(dto.occurredAt) } : {}),
        ...(dto.verified !== undefined ? { verified: dto.verified } : {}),
      },
    });
    if (dto.items) {
      await this.upsertItems(order.id, dto.items);
    }
    return this.get(order.id);
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.salesOrderItem.deleteMany({
      where: this.prisma.getTenantWhere({ salesOrderId: id }),
    });
    await this.prisma.salesOrder.delete({ where: { id } });
    return { success: true };
  }
}

