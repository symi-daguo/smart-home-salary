import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import {
  OutboundApplicationType,
  OutboundApplicationStatus,
  WarehouseOrderType,
  PaymentType,
} from './dto/outbound-application.dto'
import { WarehouseOrderType as PrismaWarehouseOrderType } from '@prisma/client'
import {
  CreateOutboundApplicationDto,
  UpdateOutboundApplicationDto,
  QueryOutboundApplicationDto,
  ApproveOutboundApplicationDto,
} from './dto/outbound-application.dto'
import {
  CreateWarehouseOrderDto,
  UpdateWarehouseOrderDto,
  QueryWarehouseOrderDto,
  QueryWarehouseOrderLogDto,
} from './dto/warehouse-order.dto'
import { ApproveInventoryCheckDto, CreateInventoryCheckDto } from './dto/inventory-check.dto'

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateOrderNo(tenantId: string, prefix: string): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await this.prisma.warehouseOrder.count({
      where: { tenantId, orderNo: { startsWith: prefix + dateStr } },
    })
    const seq = (count + 1).toString().padStart(3, '0')
    return `${prefix}${dateStr}${seq}`
  }

  private async generateApplicationNo(tenantId: string, prefix: string): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await this.prisma.outboundApplication.count({
      where: { tenantId, orderNo: { startsWith: prefix + dateStr } },
    })
    const seq = (count + 1).toString().padStart(3, '0')
    return `${prefix}${dateStr}${seq}`
  }

  async createOutboundApplication(tenantId: string, applicantId: string, dto: CreateOutboundApplicationDto) {
    const prefix = dto.type === OutboundApplicationType.SALES_PRE ? 'SQ' : 'TQ'
    const orderNo = await this.generateApplicationNo(tenantId, prefix)

    return this.prisma.outboundApplication.create({
      data: {
        tenantId,
        orderNo,
        type: dto.type as any,
        status: OutboundApplicationStatus.DRAFT as any,
        projectId: dto.projectId,
        applicantId,
        remark: dto.remark,
        items: {
          create: dto.items.map((item) => ({
            tenantId,
            productId: item.productId,
            quantity: item.quantity,
            snCodes: item.snCodes as any,
            remark: item.remark,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        project: true,
        applicant: true,
      },
    })
  }

  async listOutboundApplications(tenantId: string, query: QueryOutboundApplicationDto) {
    const where: any = { tenantId }
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.projectId) where.projectId = query.projectId
    if (query.applicantId) where.applicantId = query.applicantId
    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    return this.prisma.outboundApplication.findMany({
      where,
      include: {
        items: { include: { product: true } },
        project: true,
        applicant: true,
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getOutboundApplication(tenantId: string, id: string) {
    const app = await this.prisma.outboundApplication.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        project: true,
        applicant: true,
        reviewer: true,
        convertedOrder: { include: { items: { include: { product: true } } } },
      },
    })
    if (!app) throw new NotFoundException('出库申请单不存在')
    return app
  }

  async updateOutboundApplication(tenantId: string, id: string, dto: UpdateOutboundApplicationDto) {
    const app = await this.getOutboundApplication(tenantId, id)
    if (app.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的申请单可以修改')
    }

    return this.prisma.outboundApplication.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        remark: dto.remark,
        items: dto.items
          ? {
              deleteMany: { applicationId: id },
              create: dto.items.map((item) => ({
                tenantId,
                productId: item.productId,
                quantity: item.quantity,
                snCodes: item.snCodes as any,
                remark: item.remark,
              })),
            }
          : undefined,
      },
      include: {
        items: { include: { product: true } },
        project: true,
      },
    })
  }

  async deleteOutboundApplication(tenantId: string, id: string) {
    const app = await this.getOutboundApplication(tenantId, id)
    if (app.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的申请单可以删除')
    }

    await this.prisma.outboundApplicationItem.deleteMany({ where: { applicationId: id } })
    await this.prisma.outboundApplication.delete({ where: { id } })
    return { success: true }
  }

  async submitOutboundApplication(tenantId: string, id: string) {
    const app = await this.getOutboundApplication(tenantId, id)
    if (app.status !== 'DRAFT') {
      throw new BadRequestException('只有草稿状态的申请单可以提交')
    }

    return this.prisma.outboundApplication.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
    })
  }

  async approveOutboundApplication(
    tenantId: string,
    reviewerId: string,
    id: string,
    dto: ApproveOutboundApplicationDto,
  ) {
    const app = await this.getOutboundApplication(tenantId, id)
    if (app.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('只有待审核状态的申请单可以审核')
    }

    const items = dto.items || (app.items as any[])
    if (!items.length) {
      throw new BadRequestException('出库明细不能为空')
    }

    for (const item of items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      })
      if (!inventory || inventory.quantity < item.quantity) {
        const product = await this.prisma.product.findUnique({ where: { id: item.productId } })
        throw new BadRequestException(`产品「${product?.name || item.productId}」库存不足`)
      }
    }

    const prefixMap: Record<string, string> = {
      OUTBOUND_SALES: 'CK',
      OUTBOUND_LOAN: 'JH',
      OUTBOUND_AFTER_SALES: 'SH',
      OUTBOUND_LOST: 'DS',
      INBOUND_SALES: 'RK',
      INBOUND_PURCHASE: 'CG',
      INBOUND_AFTER_SALES: 'RH',
      INBOUND_UNKNOWN: 'WR',
    }
    const orderNo = await this.generateOrderNo(tenantId, prefixMap[dto.orderType] || 'CK')

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.warehouseOrder.create({
        data: {
          tenantId,
          orderNo,
          orderType: dto.orderType as any,
          projectId: app.projectId,
          applicationId: id,
          paymentType: dto.paymentType as any,
          remark: dto.remark,
          operatorId: reviewerId,
          items: {
            create: items.map((item: any) => ({
              tenantId,
              productId: item.productId,
              quantity: item.quantity,
              snCodes: item.snCodes as any,
              remark: item.remark,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: { decrement: item.quantity },
            lastUpdatedAt: new Date(),
          },
        })
      }

      await tx.outboundApplication.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          reviewerId,
          reviewedAt: new Date(),
          finalOrderType: dto.orderType as PrismaWarehouseOrderType,
        },
      })

      return order
    })

    return result
  }

  async rejectOutboundApplication(tenantId: string, reviewerId: string, id: string, reason: string) {
    const app = await this.getOutboundApplication(tenantId, id)
    if (app.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('只有待审核状态的申请单可以拒绝')
    }

    return this.prisma.outboundApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewerId,
        reviewedAt: new Date(),
        remark: `${app.remark || ''}\n拒绝原因：${reason}`,
      },
    })
  }

  async createWarehouseOrder(tenantId: string, operatorId: string, dto: CreateWarehouseOrderDto) {
    const isInbound = [
      'INBOUND_SALES',
      'INBOUND_PURCHASE',
      'INBOUND_AFTER_SALES',
      'INBOUND_UNKNOWN',
    ].includes(dto.orderType)

    if (!isInbound && dto.items) {
      for (const item of dto.items) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { productId: item.productId },
        })
        if (!inventory || inventory.quantity < item.quantity) {
          const product = await this.prisma.product.findUnique({ where: { id: item.productId } })
          throw new BadRequestException(`产品「${product?.name || item.productId}」库存不足`)
        }
      }
    }

    const prefixMap: Record<string, string> = {
      OUTBOUND_SALES: 'CK',
      OUTBOUND_LOAN: 'JH',
      OUTBOUND_AFTER_SALES: 'SH',
      OUTBOUND_LOST: 'DS',
      INBOUND_SALES: 'RK',
      INBOUND_PURCHASE: 'CG',
      INBOUND_AFTER_SALES: 'RH',
      INBOUND_UNKNOWN: 'WR',
    }
    const orderNo = await this.generateOrderNo(tenantId, prefixMap[dto.orderType] || 'CK')

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.warehouseOrder.create({
        data: {
          tenantId,
          orderNo,
          orderType: dto.orderType as any,
          projectId: dto.projectId,
          relatedOrderId: dto.relatedOrderId,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
          paymentType: dto.paymentType as any,
          expressNo: dto.expressNo,
          images: dto.images as any,
          remark: dto.remark,
          operatorId,
          items: {
            create: (dto.items || []).map((item) => ({
              tenantId,
              productId: item.productId,
              quantity: item.quantity,
              snCodes: item.snCodes as any,
              unitPrice: item.unitPrice,
              remark: item.remark,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      for (const item of dto.items || []) {
        const existing = await tx.inventory.findUnique({
          where: { productId: item.productId },
        })
        if (isInbound) {
          if (existing) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: { increment: item.quantity },
                lastUpdatedAt: new Date(),
              },
            })
          } else {
            await tx.inventory.create({
              data: {
                tenantId,
                productId: item.productId,
                quantity: item.quantity,
              },
            })
          }
        } else {
          if (!existing || existing.quantity < item.quantity) {
            throw new BadRequestException('库存不足')
          }
          await tx.inventory.update({
            where: { productId: item.productId },
            data: {
              quantity: { decrement: item.quantity },
              lastUpdatedAt: new Date(),
            },
          })
        }
      }

      return order
    })

    return result
  }

  async listWarehouseOrders(tenantId: string, query: QueryWarehouseOrderDto) {
    const where: any = { tenantId }
    if (query.orderType) where.orderType = query.orderType
    if (query.projectId) where.projectId = query.projectId
    if (query.remark) where.remark = { contains: query.remark, mode: 'insensitive' }
    if (query.startDate || query.endDate) {
      where.occurredAt = {}
      if (query.startDate) where.occurredAt.gte = new Date(query.startDate)
      if (query.endDate) where.occurredAt.lte = new Date(query.endDate)
    }

    if (query.productName || query.snCode) {
      where.items = {
        some: {
          ...(query.productName && {
            product: { name: { contains: query.productName, mode: 'insensitive' } },
          }),
          ...(query.snCode && { snCodes: { has: query.snCode } }),
        },
      }
    }

    return this.prisma.warehouseOrder.findMany({
      where,
      include: {
        items: { include: { product: true } },
        project: true,
        operator: true,
      },
      orderBy: { occurredAt: 'desc' },
    })
  }

  async getWarehouseOrder(tenantId: string, id: string) {
    const order = await this.prisma.warehouseOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { product: true } },
        project: true,
        operator: true,
        logs: { include: { operator: true }, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!order) throw new NotFoundException('出入库单不存在')
    return order
  }

  async updateWarehouseOrder(tenantId: string, operatorId: string, id: string, dto: UpdateWarehouseOrderDto) {
    const order = await this.getWarehouseOrder(tenantId, id)

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.warehouseOrder.update({
        where: { id },
        data: {
          projectId: dto.projectId,
          relatedOrderId: dto.relatedOrderId,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
          paymentType: dto.paymentType as any,
          expressNo: dto.expressNo,
          images: dto.images as any,
          remark: dto.remark,
          items: dto.items
            ? {
                deleteMany: { orderId: id },
                create: dto.items.map((item) => ({
                  tenantId,
                  productId: item.productId,
                  quantity: item.quantity,
                  snCodes: item.snCodes as any,
                  unitPrice: item.unitPrice,
                  remark: item.remark,
                })),
              }
            : undefined,
        },
        include: { items: { include: { product: true } } },
      })

      await tx.warehouseOrderLog.create({
        data: {
          tenantId,
          orderId: id,
          operatorId,
          action: 'UPDATE',
          changes: dto as any,
        },
      })

      return updated
    })

    return result
  }

  async deleteWarehouseOrder(tenantId: string, operatorId: string, id: string) {
    const order = await this.getWarehouseOrder(tenantId, id)

    if ((order as any).status === 'VOIDED') {
      throw new BadRequestException('已作废单据不可删除')
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.warehouseOrderLog.create({
        data: {
          tenantId,
          orderId: id,
          operatorId,
          action: 'DELETE',
          changes: order as any,
        },
      })

      await tx.warehouseOrderItem.deleteMany({ where: { orderId: id } })
      await tx.warehouseOrder.delete({ where: { id } })
    })

    return { success: true }
  }

  private isInboundOrderType(orderType: string) {
    return (
      orderType === 'INBOUND_SALES' ||
      orderType === 'INBOUND_PURCHASE' ||
      orderType === 'INBOUND_AFTER_SALES' ||
      orderType === 'INBOUND_UNKNOWN'
    )
  }

  async voidWarehouseOrder(tenantId: string, operatorId: string, id: string, reason: string) {
    const order = await this.getWarehouseOrder(tenantId, id)
    if ((order as any).status === 'VOIDED') {
      throw new BadRequestException('单据已作废')
    }
    if ((order as any).reversalOrderId) {
      throw new BadRequestException('该单据已生成冲销单')
    }

    const originalIsInbound = this.isInboundOrderType(order.orderType as any)
    const reversalType = originalIsInbound ? 'OUTBOUND_LOST' : 'INBOUND_UNKNOWN'

    const prefixMap: Record<string, string> = {
      OUTBOUND_SALES: 'CK',
      OUTBOUND_LOAN: 'JH',
      OUTBOUND_AFTER_SALES: 'SH',
      OUTBOUND_LOST: 'DS',
      INBOUND_SALES: 'RK',
      INBOUND_PURCHASE: 'CG',
      INBOUND_AFTER_SALES: 'RH',
      INBOUND_UNKNOWN: 'WR',
    }
    const reversalNo = await this.generateOrderNo(tenantId, prefixMap[reversalType] || 'WR')

    const reversal = await this.prisma.$transaction(async (tx) => {
      const reversalOrder = await tx.warehouseOrder.create({
        data: {
          tenantId,
          orderNo: reversalNo,
          orderType: reversalType as any,
          status: 'POSTED' as any,
          projectId: order.projectId,
          relatedOrderId: order.id,
          occurredAt: new Date(),
          remark: `冲销单（原单：${order.orderNo}）\n原因：${reason || ''}`,
          operatorId,
          reversalOfId: order.id,
          items: {
            create: order.items.map((item) => ({
              tenantId,
              productId: item.productId,
              quantity: item.quantity,
              snCodes: item.snCodes as any,
              remark: item.remark,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      })

      // reverse inventory impact
      for (const item of order.items as any[]) {
        const existing = await tx.inventory.findUnique({ where: { productId: item.productId } })
        if (originalIsInbound) {
          // original inbound increased inventory; reversal should decrease
          if (!existing || existing.quantity < item.quantity) {
            throw new BadRequestException('冲销失败：库存不足')
          }
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity }, lastUpdatedAt: new Date() },
          })
        } else {
          // original outbound decreased inventory; reversal should increase
          if (existing) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { quantity: { increment: item.quantity }, lastUpdatedAt: new Date() },
            })
          } else {
            await tx.inventory.create({
              data: { tenantId, productId: item.productId, quantity: item.quantity },
            })
          }
        }
      }

      await tx.warehouseOrder.update({
        where: { id: order.id },
        data: {
          status: 'VOIDED' as any,
          reversalOrderId: reversalOrder.id,
          voidReason: reason,
          voidedAt: new Date(),
        },
      })

      await tx.warehouseOrderLog.create({
        data: {
          tenantId,
          orderId: order.id,
          operatorId,
          action: 'VOID',
          changes: { reason, reversalOrderId: reversalOrder.id } as any,
        },
      })

      return reversalOrder
    })

    return reversal
  }

  async createInventoryCheck(tenantId: string, dto: CreateInventoryCheckDto) {
    if (!dto.items?.length) throw new BadRequestException('盘点明细不能为空')

    const items = dto.items.map((it) => ({
      ...it,
      diffQty: it.countedQty - it.systemQty,
    }))

    return this.prisma.inventoryCheck.create({
      data: {
        tenantId,
        remark: dto.remark,
        items: {
          create: items.map((it) => ({
            tenantId,
            productId: it.productId,
            systemQty: it.systemQty,
            countedQty: it.countedQty,
            diffQty: it.diffQty,
            remark: it.remark,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })
  }

  async listInventoryChecks(tenantId: string) {
    return this.prisma.inventoryCheck.findMany({
      where: { tenantId },
      include: { items: true, orders: true, approver: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
  }

  async getInventoryCheck(tenantId: string, id: string) {
    const check = await this.prisma.inventoryCheck.findFirst({
      where: { tenantId, id },
      include: {
        items: { include: { product: true } },
        orders: { include: { order: { include: { items: { include: { product: true } } } } } },
        approver: true,
      },
    })
    if (!check) throw new NotFoundException('盘点单不存在')
    return check
  }

  async approveInventoryCheck(tenantId: string, approverId: string, id: string, dto: ApproveInventoryCheckDto) {
    const check = await this.getInventoryCheck(tenantId, id)
    if ((check as any).status !== 'DRAFT') {
      throw new BadRequestException('只有草稿盘点单可以审核')
    }

    const positives = (check.items as any[]).filter((it) => it.diffQty > 0)
    const negatives = (check.items as any[]).filter((it) => it.diffQty < 0)

    const createdOrders = await this.prisma.$transaction(async (tx) => {
      const orders: any[] = []

      const createAdjustmentOrder = async (orderType: string, items: any[]) => {
        if (!items.length) return null
        const prefixMap: Record<string, string> = {
          OUTBOUND_SALES: 'CK',
          OUTBOUND_LOAN: 'JH',
          OUTBOUND_AFTER_SALES: 'SH',
          OUTBOUND_LOST: 'DS',
          INBOUND_SALES: 'RK',
          INBOUND_PURCHASE: 'CG',
          INBOUND_AFTER_SALES: 'RH',
          INBOUND_UNKNOWN: 'WR',
        }
        const orderNo = await this.generateOrderNo(tenantId, prefixMap[orderType] || 'WR')

        const order = await tx.warehouseOrder.create({
          data: {
            tenantId,
            orderNo,
            orderType: orderType as any,
            status: 'POSTED' as any,
            remark: `盘点调整单（盘点单：${check.id}）\n${dto.remark || ''}`.trim(),
            operatorId: approverId,
            items: {
              create: items.map((it) => ({
                tenantId,
                productId: it.productId,
                quantity: Math.abs(it.diffQty),
              })),
            },
          },
          include: { items: true },
        })

        // apply inventory impact
        const isInbound = this.isInboundOrderType(orderType)
        for (const it of items) {
          const qty = Math.abs(it.diffQty)
          const existing = await tx.inventory.findUnique({ where: { productId: it.productId } })
          if (isInbound) {
            if (existing) {
              await tx.inventory.update({
                where: { productId: it.productId },
                data: { quantity: { increment: qty }, lastUpdatedAt: new Date() },
              })
            } else {
              await tx.inventory.create({ data: { tenantId, productId: it.productId, quantity: qty } })
            }
          } else {
            if (!existing || existing.quantity < qty) throw new BadRequestException('盘点调整失败：库存不足')
            await tx.inventory.update({
              where: { productId: it.productId },
              data: { quantity: { decrement: qty }, lastUpdatedAt: new Date() },
            })
          }
        }

        await tx.inventoryCheckOrder.create({
          data: { tenantId, checkId: check.id, orderId: order.id },
        })
        orders.push(order)
        return order
      }

      await createAdjustmentOrder('INBOUND_UNKNOWN', positives)
      await createAdjustmentOrder('OUTBOUND_LOST', negatives)

      await tx.inventoryCheck.update({
        where: { id: check.id },
        data: {
          status: 'APPROVED' as any,
          approvedAt: new Date(),
          approverId,
          remark: dto.remark ? `${check.remark || ''}\n${dto.remark}`.trim() : check.remark,
        },
      })

      return orders
    })

    return { success: true, orders: createdOrders }
  }

  async traceSn(tenantId: string, sn: string) {
    if (!sn) throw new BadRequestException('sn 不能为空')

    const [applications, orders] = await Promise.all([
      this.prisma.outboundApplication.findMany({
        where: { tenantId, items: { some: { snCodes: { array_contains: [sn] } } } },
        include: { project: true, applicant: true, reviewer: true, items: { include: { product: true } }, convertedOrder: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.warehouseOrder.findMany({
        where: { tenantId, items: { some: { snCodes: { array_contains: [sn] } } } },
        include: { project: true, operator: true, items: { include: { product: true } } },
        orderBy: { occurredAt: 'desc' },
        take: 100,
      }),
    ])

    return { sn, applications, orders }
  }

  async listWarehouseOrderLogs(tenantId: string, query: QueryWarehouseOrderLogDto) {
    const where: any = { tenantId }

    if (query.action) {
      where.action = query.action
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) where.createdAt.gte = new Date(query.startDate)
      if (query.endDate) where.createdAt.lte = new Date(query.endDate)
    }

    const logs = await this.prisma.warehouseOrderLog.findMany({
      where,
      include: {
        order: true,
        operator: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const filtered = query.orderNo || query.orderType
      ? logs.filter((log) => {
          if (query.orderNo && !log.order.orderNo.includes(query.orderNo)) {
            return false
          }
          if (query.orderType && log.order.orderType !== (query.orderType as any)) {
            return false
          }
          return true
        })
      : logs

    return filtered
  }

  async listInventory(tenantId: string) {
    return this.prisma.inventory.findMany({
      where: { tenantId },
      include: {
        product: true,
      },
      orderBy: { lastUpdatedAt: 'desc' },
    })
  }

  async getInventoryCost(tenantId: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      include: { product: true },
    })

    let totalCost = 0
    const details = inventories.map((inv) => {
      const costPrice = Number(inv.product.costPrice || 0)
      const itemCost = costPrice * inv.quantity
      totalCost += itemCost
      return {
        productId: inv.productId,
        productName: inv.product.name,
        quantity: inv.quantity,
        costPrice,
        totalCost: itemCost,
      }
    })

    return { totalCost, details }
  }

  async adjustInventory(tenantId: string, productId: string, quantity: number, remark?: string) {
    const existing = await this.prisma.inventory.findUnique({
      where: { productId },
    })

    if (existing) {
      return this.prisma.inventory.update({
        where: { productId },
        data: {
          quantity,
          lastUpdatedAt: new Date(),
        },
      })
    } else {
      return this.prisma.inventory.create({
        data: {
          tenantId,
          productId,
          quantity,
        },
      })
    }
  }
}
