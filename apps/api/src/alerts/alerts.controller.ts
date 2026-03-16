import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AlertSeverity } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ListAlertsDto, RunProjectCompareDto } from './dto/alerts.dto';
import { AlertsService } from './alerts.service';

@ApiTags('Alerts')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('alerts')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '预警列表（可按项目/级别/未处理过滤）' })
  @ApiResponse({ status: 200 })
  async list(@Query() query: ListAlertsDto) {
    const unresolved = query.unresolved === 'true';
    const severity = query.severity as AlertSeverity | undefined;
    return this.alerts.list({
      projectId: query.projectId,
      severity,
      unresolved,
    });
  }

  @Post('run')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '运行一次项目数据比对并生成预警（MVP 仅支持单项目）' })
  async run(@Body() dto: RunProjectCompareDto) {
    return this.alerts.run(dto);
  }

  @Post('run-all')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '运行所有预警检查（库存预警、折扣率预警、收款不足预警）' })
  async runAll() {
    return this.alerts.runAllAlerts();
  }

  @Patch(':id/resolve')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '标记预警为已处理' })
  async resolve(@Param('id') id: string) {
    return this.alerts.resolve(id);
  }
}

