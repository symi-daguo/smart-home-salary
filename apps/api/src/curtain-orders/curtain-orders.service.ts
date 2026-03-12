import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { CreateCurtainOrderDto } from './dto/curtain-order.dto';

@Injectable()
export class CurtainOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  private requireTenantId() {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    return tenantId;
  }

  async list(projectId?: string) {
    const tenantId = this.requireTenantId();
    return this.prisma.curtainOrder.findMany({
      where: { tenantId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { project: true, rooms: true },
    });
  }

  async create(dto: CreateCurtainOrderDto) {
    const tenantId = this.requireTenantId();
    if ((dto.rooms ?? []).length !== dto.roomCount) {
      throw new BadRequestException('rooms length must equal roomCount');
    }

    return this.prisma.curtainOrder.create({
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
  }

  async remove(id: string) {
    const tenantId = this.requireTenantId();
    const existing = await this.prisma.curtainOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return { success: true };
    await this.prisma.curtainRoom.deleteMany({ where: { curtainOrderId: id, tenantId } });
    await this.prisma.curtainOrder.delete({ where: { id } });
    return { success: true };
  }
}

