import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import {
  CreateInstallationRecordDto,
  CreateInstallationRecordMyDto,
  UpdateInstallationRecordDto,
} from './dto/installation-record.dto';
import { InstallationRecordsService } from './installation-records.service';
import { PrismaService } from '../common/prisma.service';
import type { Request } from 'express';

@ApiTags('Installation Records')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('installation-records')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class InstallationRecordsController {
  constructor(
    private readonly installationRecords: InstallationRecordsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCurrentEmployeeId(req: Request): Promise<string> {
    const user = req.user as { sub?: string; activeTenantId?: string } | undefined;
    const userId = user?.sub;
    const headerTenantId = (req.headers['x-tenant-id'] ||
      req.headers['X-Tenant-ID']) as string | undefined;
    const tenantId = headerTenantId || user?.activeTenantId;
    if (!userId || !tenantId) {
      throw new UnauthorizedException('缺少用户或租户上下文');
    }
    const membership = await this.prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { employee: true },
    });
    if (!membership?.employee) {
      throw new UnauthorizedException('当前用户未绑定员工档案，无法上报技术数据');
    }
    return membership.employee.id;
  }

  @Get()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '安装/调试记录列表' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.installationRecords.list();
  }

  @Get('my')
  @RequirePermissions('installation.read')
  @ApiOperation({ summary: '当前员工自己的安装/调试记录列表' })
  async listMy(@Req() req: Request) {
    const employeeId = await this.resolveCurrentEmployeeId(req);
    return this.installationRecords.listForEmployee(employeeId);
  }

  @Get(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '获取安装/调试记录详情' })
  async get(@Param('id') id: string) {
    return this.installationRecords.get(id);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '创建安装/调试记录' })
  async create(@Body() dto: CreateInstallationRecordDto) {
    return this.installationRecords.create(dto);
  }

  @Post('my')
  @RequirePermissions('installation.create')
  @ApiOperation({ summary: '当前员工上报安装/调试记录（无需 employeeId，服务端自动解析）' })
  async createMy(@Req() req: Request, @Body() dto: CreateInstallationRecordMyDto) {
    const employeeId = await this.resolveCurrentEmployeeId(req);
    return this.installationRecords.createForEmployee(employeeId, dto);
  }

  @Put(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '更新安装/调试记录' })
  async update(@Param('id') id: string, @Body() dto: UpdateInstallationRecordDto) {
    return this.installationRecords.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除安装/调试记录' })
  async remove(@Param('id') id: string) {
    return this.installationRecords.remove(id);
  }
}

