import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateInstallationRecordDto,
  UpdateInstallationRecordDto,
} from './dto/installation-record.dto';

@Injectable()
export class InstallationRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.installationRecord.findMany({
      where: this.prisma.getTenantWhere(),
      include: {
        employee: true,
        project: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForEmployee(employeeId: string) {
    return this.prisma.installationRecord.findMany({
      where: this.prisma.getTenantWhere({ employeeId }),
      include: {
        employee: true,
        project: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.installationRecord.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: {
        employee: true,
        project: true,
        product: true,
      },
    });
    if (!row) throw new NotFoundException('安装/调试记录不存在');
    return row;
  }

  private mapPhotoUrls(urls: string[] | undefined) {
    if (!urls) return undefined;
    return urls;
  }

  async create(dto: CreateInstallationRecordDto) {
    return this.prisma.installationRecord.create({
      data: this.prisma.getTenantData({
        projectId: dto.projectId,
        employeeId: dto.employeeId,
        productId: dto.productId,
        serviceType: dto.serviceType,
        quantity: dto.quantity,
        difficultyFactor: dto.difficultyFactor ?? 1.0,
        photoUrls: this.mapPhotoUrls(dto.photoUrls),
        description: dto.description ?? undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      }),
      include: {
        employee: true,
        project: true,
        product: true,
      },
    });
  }

  async createForEmployee(employeeId: string, dto: Omit<CreateInstallationRecordDto, 'employeeId'>) {
    return this.create({ ...dto, employeeId });
  }

  async update(id: string, dto: UpdateInstallationRecordDto) {
    await this.get(id);
    return this.prisma.installationRecord.update({
      where: { id },
      data: {
        ...(dto.serviceType !== undefined ? { serviceType: dto.serviceType } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(dto.difficultyFactor !== undefined ? { difficultyFactor: dto.difficultyFactor } : {}),
        ...(dto.photoUrls !== undefined ? { photoUrls: this.mapPhotoUrls(dto.photoUrls ?? undefined) } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.occurredAt !== undefined ? { occurredAt: new Date(dto.occurredAt) } : {}),
      },
      include: {
        employee: true,
        project: true,
        product: true,
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.installationRecord.delete({ where: { id } });
    return { success: true };
  }
}

