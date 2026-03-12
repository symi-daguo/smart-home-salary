import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProjectDto, ProjectItemInput, UpdateProjectDto } from './dto/project.dto';

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
}

