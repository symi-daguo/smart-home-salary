import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateCurtainOrderDto, CalculateCurtainPriceDto, CurtainPriceResultDto } from './dto/curtain-order.dto';

@Injectable()
export class CurtainOrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 计算窗帘价格
   * 根据需求文档 v1.0.8:
   * 1. 布匹销售: 高度 x 长度 x 商品单价
   * 2. 轨道费用: 房间数量 x 单双层 x 单根轨道长度总长进1位 (卷帘除外)
   * 3. 下单根数费用: 房间数量 x 单双层 x 200元/根
   */
  async calculatePrice(dto: CalculateCurtainPriceDto, tenantId?: string): Promise<CurtainPriceResultDto> {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    const result: CurtainPriceResultDto = {
      fabricPrice: 0,
      trackPrice: 0,
      rodPrice: 0,
      totalPrice: 0,
      details: [],
    };

    for (const room of dto.rooms) {
      const roomDetail: any = {
        roomName: room.roomName,
        curtainType: room.curtainType,
        layerType: room.layerType,
        fabricPrice: 0,
        trackPrice: 0,
        rodPrice: 0,
      };

      // 1. 计算布匹价格 (如果带布匹销售)
      if (room.withFabric && room.fabricProductId && room.fabricHeight) {
        const fabricProduct = await this.prisma.product.findFirst({
          where: { id: room.fabricProductId, tenantId },
        });

        if (fabricProduct) {
          // 计算轨道总长度
          const trackLength = this.calculateTrackLength(room);
          // 布匹价格 = 高度 x 长度 x 单价
          const fabricHeight = Number(room.fabricHeight);
          const fabricUnitPrice = Number(fabricProduct.standardPrice);
          roomDetail.fabricPrice = Math.round(fabricHeight * trackLength * fabricUnitPrice * 100) / 100;
          result.fabricPrice += roomDetail.fabricPrice;
        }
      }

      // 2. 计算轨道费用 (卷帘除外)
      if (room.curtainType !== 'ROLLER_BLIND') {
        const trackLength = this.calculateTrackLength(room);
        // 向上取整到米 (3.7米 -> 4米, 4.6米 -> 5米)
        const roundedTrackLength = Math.ceil(trackLength);
        // 单双层系数
        const layerFactor = room.layerType === 'DOUBLE' ? 2 : 1;
        // 轨道费用 = 房间数量(1) x 单双层 x 轨道长度(向上取整)
        // 这里假设每米轨道200元
        const trackUnitPrice = 200; // 200元/米
        roomDetail.trackPrice = roundedTrackLength * layerFactor * trackUnitPrice;
        result.trackPrice += roomDetail.trackPrice;
      }

      // 3. 计算下单根数费用
      const layerFactor = room.layerType === 'DOUBLE' ? 2 : 1;
      // 下单根数 = 1(房间) x 单双层
      const rodCount = layerFactor;
      // 下单根数费用 = 根数 x 200元/根
      const rodUnitPrice = 200; // 200元/根
      roomDetail.rodPrice = rodCount * rodUnitPrice;
      result.rodPrice += roomDetail.rodPrice;

      result.details.push(roomDetail);
    }

    // 计算总价
    result.totalPrice = result.fabricPrice + result.trackPrice + result.rodPrice;

    return result;
  }

  /**
   * 计算轨道长度
   */
  private calculateTrackLength(room: any): number {
    let length = 0;

    // 根据窗帘类型计算长度
    switch (room.curtainType) {
      case 'STRAIGHT_TRACK':
      case 'EMBEDDED_TRACK':
      case 'DREAM_TRACK':
        // 直轨: 左 + 右 或 中间长度
        if (room.leftLength) length += Number(room.leftLength);
        if (room.rightLength) length += Number(room.rightLength);
        if (room.middleLength) length += Number(room.middleLength);
        break;
      case 'L_TRACK':
      case 'EMBEDDED_L_TRACK':
        // L轨: 左 + 右
        if (room.leftLength) length += Number(room.leftLength);
        if (room.rightLength) length += Number(room.rightLength);
        break;
      case 'ARC_TRACK':
      case 'U_TRACK':
        // 弧形/U型: 左 + 右 + 中间
        if (room.leftLength) length += Number(room.leftLength);
        if (room.rightLength) length += Number(room.rightLength);
        if (room.middleLength) length += Number(room.middleLength);
        break;
      case 'ROLLER_BLIND':
      case 'LIFT_BLIND':
        // 卷帘/升降帘: 使用中间长度或左+右
        if (room.middleLength) {
          length += Number(room.middleLength);
        } else {
          if (room.leftLength) length += Number(room.leftLength);
          if (room.rightLength) length += Number(room.rightLength);
        }
        break;
      default:
        // 默认使用所有长度之和
        if (room.leftLength) length += Number(room.leftLength);
        if (room.rightLength) length += Number(room.rightLength);
        if (room.middleLength) length += Number(room.middleLength);
    }

    return length || 0;
  }

  /**
   * 创建窗帘订单并自动生成销售出库单
   */
  async create(dto: CreateCurtainOrderDto & { autoGenerateOutbound?: boolean; operatorId?: string }, tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    if ((dto.rooms ?? []).length !== dto.roomCount) {
      throw new BadRequestException('rooms length must equal roomCount');
    }

    // 计算价格
    let priceResult: CurtainPriceResultDto | null = null;
    if (dto.roomDetails && dto.roomDetails.length > 0) {
      priceResult = await this.calculatePrice({ rooms: dto.roomDetails }, tenantId);
    }

    // 使用事务创建订单和出库单
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 创建窗帘订单
      const curtainOrder = await tx.curtainOrder.create({
        data: {
          tenantId,
          projectId: dto.projectId,
          roomCount: dto.roomCount,
          deliveryToDoor: dto.deliveryToDoor ?? false,
          receiverName: dto.receiverName,
          deliveryAddress: dto.deliveryAddress,
          thirdPartyInstall: dto.thirdPartyInstall ?? false,
          remark: dto.remark,
          rooms: {
            create: dto.rooms.map((r) => ({
              tenantId,
              roomName: r.roomName,
              detail: r.detail as Prisma.InputJsonValue,
              mediaUrls: (r.mediaUrls ?? undefined) as any,
              remark: r.remark,
            })),
          },
        },
        include: { project: true, rooms: true },
      });

      // 2. 创建房间详情 (如果有)
      if (dto.roomDetails && dto.roomDetails.length > 0) {
        for (let i = 0; i < dto.roomDetails.length; i++) {
          const detail = dto.roomDetails[i];
          const room = curtainOrder.rooms[i];
          if (room) {
            await tx.curtainRoomDetail.create({
              data: {
                tenantId,
                roomId: room.id,
                roomName: detail.roomName,
                curtainType: detail.curtainType as any,
                hasCurtainBox: detail.hasCurtainBox ?? false,
                curtainBoxWidth: detail.curtainBoxWidth ? new Prisma.Decimal(detail.curtainBoxWidth) : null,
                curtainBoxMaterial: detail.curtainBoxMaterial,
                leftLength: detail.leftLength ? new Prisma.Decimal(detail.leftLength) : null,
                rightLength: detail.rightLength ? new Prisma.Decimal(detail.rightLength) : null,
                middleLength: detail.middleLength ? new Prisma.Decimal(detail.middleLength) : null,
                lDirection: detail.lDirection,
                installType: detail.installType,
                hasShell: detail.hasShell,
                layerType: detail.layerType as any,
                installPosition: detail.installPosition,
                powerPosition: detail.powerPosition,
                motorProductId: detail.motorProductId,
                withFabric: detail.withFabric ?? false,
                fabricHeight: detail.fabricHeight ? new Prisma.Decimal(detail.fabricHeight) : null,
                fabricProductId: detail.fabricProductId,
                remark: detail.remark,
                mediaUrls: detail.mediaUrls as any,
              },
            });
          }
        }
      }

      // 3. 自动生成销售出库单 (如果启用且需要出库布匹)
      let outboundOrder = null;
      if (dto.autoGenerateOutbound && priceResult && priceResult.fabricPrice > 0 && dto.operatorId) {
        outboundOrder = await this.createFabricOutboundOrder(tx, tenantId, dto, curtainOrder, priceResult);
      }

      // 4. 更新项目应收款
      if (priceResult && priceResult.totalPrice > 0) {
        await this.updateProjectReceivables(tx, tenantId, dto.projectId, priceResult.totalPrice);
      }

      return {
        ...curtainOrder,
        priceResult,
        outboundOrder,
      };
    });

    return result;
  }

  /**
   * 更新窗帘订单
   */
  async update(id: string, dto: CreateCurtainOrderDto & { autoGenerateOutbound?: boolean; operatorId?: string }, tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    const existing = await this.prisma.curtainOrder.findFirst({
      where: { id, tenantId },
      include: { rooms: true },
    });

    if (!existing) {
      throw new NotFoundException('窗帘订单不存在');
    }

    // 计算价格
    let priceResult: CurtainPriceResultDto | null = null;
    if (dto.roomDetails && dto.roomDetails.length > 0) {
      priceResult = await this.calculatePrice({ rooms: dto.roomDetails }, tenantId);
    }

    // 使用事务更新订单
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 删除原有房间
      await tx.curtainRoom.deleteMany({
        where: { curtainOrderId: id, tenantId },
      });

      // 2. 更新窗帘订单
      const curtainOrder = await tx.curtainOrder.update({
        where: { id },
        data: {
          projectId: dto.projectId,
          roomCount: dto.roomCount,
          deliveryToDoor: dto.deliveryToDoor ?? false,
          receiverName: dto.receiverName,
          deliveryAddress: dto.deliveryAddress,
          thirdPartyInstall: dto.thirdPartyInstall ?? false,
          remark: dto.remark,
          rooms: {
            create: dto.rooms.map((r) => ({
              tenantId,
              roomName: r.roomName,
              detail: r.detail as Prisma.InputJsonValue,
              mediaUrls: (r.mediaUrls ?? undefined) as any,
              remark: r.remark,
            })),
          },
        },
        include: { project: true, rooms: true },
      });

      // 3. 创建房间详情 (如果有)
      if (dto.roomDetails && dto.roomDetails.length > 0) {
        for (let i = 0; i < dto.roomDetails.length; i++) {
          const detail = dto.roomDetails[i];
          const room = curtainOrder.rooms[i];
          if (room) {
            await tx.curtainRoomDetail.create({
              data: {
                tenantId,
                roomId: room.id,
                roomName: detail.roomName,
                curtainType: detail.curtainType as any,
                hasCurtainBox: detail.hasCurtainBox ?? false,
                curtainBoxWidth: detail.curtainBoxWidth ? new Prisma.Decimal(detail.curtainBoxWidth) : null,
                curtainBoxMaterial: detail.curtainBoxMaterial,
                leftLength: detail.leftLength ? new Prisma.Decimal(detail.leftLength) : null,
                rightLength: detail.rightLength ? new Prisma.Decimal(detail.rightLength) : null,
                middleLength: detail.middleLength ? new Prisma.Decimal(detail.middleLength) : null,
                lDirection: detail.lDirection,
                installType: detail.installType,
                hasShell: detail.hasShell,
                layerType: detail.layerType as any,
                installPosition: detail.installPosition,
                powerPosition: detail.powerPosition,
                motorProductId: detail.motorProductId,
                withFabric: detail.withFabric ?? false,
                fabricHeight: detail.fabricHeight ? new Prisma.Decimal(detail.fabricHeight) : null,
                fabricProductId: detail.fabricProductId,
                remark: detail.remark,
                mediaUrls: detail.mediaUrls as any,
              },
            });
          }
        }
      }

      // 4. 更新项目应收款
      if (priceResult && priceResult.totalPrice > 0) {
        await this.updateProjectReceivables(tx, tenantId, dto.projectId, priceResult.totalPrice);
      }

      return {
        ...curtainOrder,
        priceResult,
      };
    });

    return result;
  }

  /**
   * 创建布匹销售出库单
   */
  private async createFabricOutboundOrder(
    tx: any,
    tenantId: string,
    dto: CreateCurtainOrderDto,
    curtainOrder: any,
    priceResult: CurtainPriceResultDto,
  ) {
    // 生成出库单号
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await tx.warehouseOrder.count({
      where: { orderNo: { startsWith: 'CK' + dateStr } },
    });
    const seq = (count + 1).toString().padStart(3, '0');
    const orderNo = `CK${dateStr}${seq}`;

    // 收集需要出库的布匹商品
    const outboundItems: any[] = [];
    for (const room of dto.roomDetails || []) {
      if (room.withFabric && room.fabricProductId && room.fabricHeight) {
        const trackLength = this.calculateTrackLength(room);
        const fabricProduct = await tx.product.findFirst({
          where: { id: room.fabricProductId, tenantId },
        });

        if (fabricProduct) {
          outboundItems.push({
            productId: room.fabricProductId,
            quantity: Math.ceil(trackLength), // 向上取整到米
            unitPrice: Number(fabricProduct.standardPrice),
            remark: `${room.roomName} - 布匹出库`,
          });
        }
      }
    }

    if (outboundItems.length === 0) {
      return null;
    }

    // 创建出库单
    const outboundOrder = await tx.warehouseOrder.create({
      data: {
        tenantId,
        orderNo,
        orderType: 'OUTBOUND_SALES',
        projectId: dto.projectId,
        relatedOrderId: curtainOrder.id,
        occurredAt: new Date(),
        paymentType: 'UNPAID',
        remark: `窗帘订单自动生成的布匹销售出库单 - 订单ID: ${curtainOrder.id}`,
        operatorId: dto.operatorId,
        items: {
          create: outboundItems.map((item) => ({
            tenantId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            remark: item.remark,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // 扣减库存
    for (const item of outboundItems) {
      const inventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: { decrement: item.quantity },
            lastUpdatedAt: new Date(),
          },
        });
      }
    }

    return outboundOrder;
  }

  /**
   * 更新项目应收款
   */
  private async updateProjectReceivables(
    tx: any,
    tenantId: string,
    projectId: string,
    amount: number,
  ) {
    // 获取项目当前信息
    const project = await tx.project.findFirst({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 这里可以添加项目应收款的更新逻辑
    // 例如: 更新项目的某个字段来记录应收款
    // 目前项目模型中没有直接的 receivables 字段，可以通过 salesOrders 来追踪

    // 创建一条销售记录来表示这笔应收款
    // 注意: 这里不创建 SalesOrder，因为窗帘订单有独立的流程
    // 而是通过其他方式记录

    return project;
  }

  async list(projectId?: string, tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    return this.prisma.curtainOrder.findMany({
      where: { tenantId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        rooms: {
          include: {
            details: {
              include: {
                motorProduct: true,
                fabricProduct: true,
              },
            },
          },
        },
      },
    });
  }

  async getById(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    const order = await this.prisma.curtainOrder.findFirst({
      where: { id, tenantId },
      include: {
        project: true,
        rooms: {
          include: {
            details: {
              include: {
                motorProduct: true,
                fabricProduct: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('窗帘订单不存在');
    }

    return order;
  }

  async remove(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new BadRequestException('Missing tenant context');
    }

    const existing = await this.prisma.curtainOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return { success: true };

    // 删除关联的房间详情
    await this.prisma.curtainRoomDetail.deleteMany({
      where: {
        room: {
          curtainOrderId: id,
        },
      },
    });

    await this.prisma.curtainRoom.deleteMany({ where: { curtainOrderId: id, tenantId } });
    await this.prisma.curtainOrder.delete({ where: { id } });
    return { success: true };
  }
}
