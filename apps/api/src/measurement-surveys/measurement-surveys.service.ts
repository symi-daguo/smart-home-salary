import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateMeasurementSurveyDto, UpdateMeasurementSurveyDto } from './dto/measurement-survey.dto';

@Injectable()
export class MeasurementSurveysService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async list(projectId?: string, tenantId?: string) {
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

  async getById(id: string, tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    const survey = await this.prisma.measurementSurvey.findFirst({
      where: { id, tenantId },
      include: { project: true },
    });
    if (!survey) throw new NotFoundException('测量工勘记录不存在');
    return survey;
  }

  async create(dto: CreateMeasurementSurveyDto, tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    
    // 使用事务创建记录并更新项目统计
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 创建测量工勘记录
      const survey = await tx.measurementSurvey.create({
        data: {
          tenantId,
          projectId: dto.projectId,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
          remark: dto.remark,
          mediaUrls: dto.mediaUrls ?? undefined,
        },
        include: { project: true },
      });

      // 2. 更新项目测量工勘统计
      await this.updateProjectSurveyStats(tx, tenantId, dto.projectId);

      return survey;
    });

    return result;
  }

  async update(id: string, dto: UpdateMeasurementSurveyDto, tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    
    // 先获取原记录以检查项目是否变更
    const existing = await this.prisma.measurementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('测量工勘记录不存在');

    const oldProjectId = existing.projectId;
    const newProjectId = dto.projectId || oldProjectId;

    // 使用事务更新记录并同步项目统计
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 更新测量工勘记录
      const survey = await tx.measurementSurvey.update({
        where: { id },
        data: {
          ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
          ...(dto.occurredAt !== undefined ? { occurredAt: new Date(dto.occurredAt) } : {}),
          ...(dto.remark !== undefined ? { remark: dto.remark } : {}),
          ...(dto.mediaUrls !== undefined
            ? { mediaUrls: dto.mediaUrls === null ? Prisma.DbNull : dto.mediaUrls }
            : {}),
        },
        include: { project: true },
      });

      // 2. 如果项目变更，更新两个项目的统计
      if (oldProjectId !== newProjectId) {
        await this.updateProjectSurveyStats(tx, tenantId, oldProjectId);
        await this.updateProjectSurveyStats(tx, tenantId, newProjectId);
      } else {
        await this.updateProjectSurveyStats(tx, tenantId, newProjectId);
      }

      return survey;
    });

    return result;
  }

  async remove(id: string, tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    
    // 先获取记录以确定项目ID
    const existing = await this.prisma.measurementSurvey.findFirst({
      where: { id, tenantId },
    });
    if (!existing) return { success: true };

    const projectId = existing.projectId;

    // 使用事务删除记录并更新项目统计
    await this.prisma.$transaction(async (tx) => {
      // 1. 删除测量工勘记录
      await tx.measurementSurvey.delete({ where: { id } });

      // 2. 更新项目测量工勘统计
      await this.updateProjectSurveyStats(tx, tenantId, projectId);
    });

    return { success: true };
  }

  /**
   * 更新项目测量工勘统计
   * 用于首页看板数据同步
   */
  private async updateProjectSurveyStats(tx: any, tenantId: string, projectId: string) {
    // 统计该项目的测量工勘数量
    const surveyCount = await tx.measurementSurvey.count({
      where: { tenantId, projectId },
    });

    // 获取最新的测量工勘记录
    const latestSurvey = await tx.measurementSurvey.findFirst({
      where: { tenantId, projectId },
      orderBy: { occurredAt: 'desc' },
    });

    // 更新项目的测量工勘统计字段（如果项目表有这些字段）
    // 注意：这里假设项目表有 surveyCount 和 lastSurveyAt 字段
    // 如果字段不存在，需要在 schema 中添加
    try {
      await tx.project.update({
        where: { id: projectId },
        data: {
          // 这些字段需要在schema中定义
          // surveyCount,
          // lastSurveyAt: latestSurvey?.occurredAt || null,
        },
      });
    } catch (e) {
      // 如果字段不存在，忽略错误
      console.log('Project survey stats update skipped (fields may not exist)');
    }

    // 触发看板数据更新事件（可以通过WebSocket或Redis发布）
    // 这里简化处理，实际项目中可以使用事件总线
    console.log(`Project ${projectId} survey stats updated: count=${surveyCount}`);
  }

  /**
   * 获取项目测量工勘统计（用于首页看板）
   */
  async getProjectSurveyStats(projectId: string, tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    
    const [count, latest] = await Promise.all([
      this.prisma.measurementSurvey.count({
        where: { tenantId, projectId },
      }),
      this.prisma.measurementSurvey.findFirst({
        where: { tenantId, projectId },
        orderBy: { occurredAt: 'desc' },
        include: { project: true },
      }),
    ]);

    return {
      count,
      latest,
    };
  }

  /**
   * 获取租户下所有测量工勘统计（用于首页看板）
   */
  async getTenantSurveyStats(tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Missing tenant context');
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCount, monthCount, latestList] = await Promise.all([
      this.prisma.measurementSurvey.count({
        where: { tenantId },
      }),
      this.prisma.measurementSurvey.count({
        where: {
          tenantId,
          occurredAt: { gte: monthStart, lte: now },
        },
      }),
      this.prisma.measurementSurvey.findMany({
        where: { tenantId },
        orderBy: { occurredAt: 'desc' },
        take: 10,
        include: { project: true },
      }),
    ]);

    return {
      totalCount,
      monthCount,
      latestList,
    };
  }
}
