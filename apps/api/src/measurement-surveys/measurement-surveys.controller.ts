import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  async list(@Query('projectId') projectId?: string) {
    return this.surveys.list(projectId);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '新增测量工勘-信息记录' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateMeasurementSurveyDto) {
    return this.surveys.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '更新测量工勘-信息记录' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateMeasurementSurveyDto) {
    return this.surveys.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除测量工勘-信息记录' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    return this.surveys.remove(id);
  }
}

