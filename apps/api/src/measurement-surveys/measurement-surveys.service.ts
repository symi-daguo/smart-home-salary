import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { CreateMeasurementSurveyDto, UpdateMeasurementSurveyDto } from './dto/measurement-survey.dto';

@Injectable()
export class MeasurementSurveysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantCtx: TenantContextService,
  ) {}

  async list(projectId?: string) {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    return this.prisma.measurementSurvey.findMany({
      where: {
        tenantId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      include: { project: true },
    });
  }

  async create(dto: CreateMeasurementSurveyDto) {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    return this.prisma.measurementSurvey.create({
      data: {
        tenantId,
        projectId: dto.projectId,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        remark: dto.remark,
        mediaUrls: dto.mediaUrls ?? undefined,
      },
      include: { project: true },
    });
  }

  async update(id: string, dto: UpdateMeasurementSurveyDto) {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    return this.prisma.measurementSurvey.update({
      where: { id },
      data: {
        ...(dto.occurredAt !== undefined ? { occurredAt: new Date(dto.occurredAt) } : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark } : {}),
        ...(dto.mediaUrls !== undefined
          ? { mediaUrls: dto.mediaUrls === null ? Prisma.DbNull : dto.mediaUrls }
          : {}),
      },
      include: { project: true },
    });
  }

  async remove(id: string) {
    const tenantId = this.tenantCtx.getTenantId();
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    // Prisma 的 delete where 只能用 unique 字段；这里先校验 tenantId 再删除
    const existing = await this.prisma.measurementSurvey.findFirst({ where: { id, tenantId } });
    if (!existing) return { success: true };
    await this.prisma.measurementSurvey.delete({ where: { id } });
    return { success: true };
  }
}

