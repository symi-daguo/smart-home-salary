import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateMeasurementSurveyDto, UpdateMeasurementSurveyDto } from './dto/measurement-survey.dto';
import { MeasurementSurveysService } from './measurement-surveys.service';

@ApiTags('MeasurementSurveys')
@ApiBearerAuth('JWT-auth')
@Controller('measurement-surveys')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@ApiSecurity('X-Tenant-ID')
export class MeasurementSurveysController {
  constructor(private readonly surveys: MeasurementSurveysService) {}

  @Get()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '测量工勘-信息记录列表（可按项目过滤）' })
  @ApiResponse({ status: 200 })
  async list(@Query('projectId') projectId?: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.surveys.list(projectId, tenantId);
  }

  @Get(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '获取测量工勘详情' })
  @ApiResponse({ status: 200 })
  async getById(@Param('id') id: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.surveys.getById(id, tenantId);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '新增测量工勘-信息记录' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateMeasurementSurveyDto, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.surveys.create(dto, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '更新测量工勘-信息记录' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateMeasurementSurveyDto, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.surveys.update(id, dto, tenantId);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除测量工勘-信息记录' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.surveys.remove(id, tenantId);
  }
}
