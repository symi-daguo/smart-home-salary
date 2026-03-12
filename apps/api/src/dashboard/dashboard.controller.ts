import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardRevenueTrendPointDto } from './dto/dashboard-revenue-trend.dto';
import { DashboardInstallationBreakdownItemDto } from './dto/dashboard-installation-breakdown.dto';
import { DashboardRecentSalesItemDto } from './dto/dashboard-recent-sales.dto';
import { DashboardRecentInstallationItemDto } from './dto/dashboard-recent-installations.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '工作台总览统计（本月营收/订单/员工/预警）' })
  @ApiResponse({ status: 200, type: DashboardOverviewDto })
  async getOverview(): Promise<DashboardOverviewDto> {
    return this.dashboard.getOverview();
  }

  @Get('revenue-trend')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '营收趋势（按月，默认最近 6 个月）' })
  @ApiResponse({ status: 200, type: [DashboardRevenueTrendPointDto] })
  async getRevenueTrend(@Query('months') months?: string): Promise<DashboardRevenueTrendPointDto[]> {
    const m = months ? Number(months) : undefined;
    return this.dashboard.getRevenueTrend({ months: Number.isFinite(m as number) ? (m as number) : undefined });
  }

  @Get('installation-breakdown')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '安装品类分布（按商品分类汇总，默认最近 7 天）' })
  @ApiResponse({ status: 200, type: [DashboardInstallationBreakdownItemDto] })
  async getInstallationBreakdown(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ): Promise<DashboardInstallationBreakdownItemDto[]> {
    const d = days ? Number(days) : undefined;
    const l = limit ? Number(limit) : undefined;
    return this.dashboard.getInstallationBreakdown({
      days: Number.isFinite(d as number) ? (d as number) : undefined,
      limit: Number.isFinite(l as number) ? (l as number) : undefined,
    });
  }

  @Get('recent-sales')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '近期销售动态（默认 10 条）' })
  @ApiResponse({ status: 200, type: [DashboardRecentSalesItemDto] })
  async getRecentSales(@Query('limit') limit?: string): Promise<DashboardRecentSalesItemDto[]> {
    const l = limit ? Number(limit) : undefined;
    return this.dashboard.getRecentSales({ limit: Number.isFinite(l as number) ? (l as number) : undefined });
  }

  @Get('recent-installations')
  @RequirePermissions('alerts.read')
  @ApiOperation({ summary: '近期安装记录（默认 10 条）' })
  @ApiResponse({ status: 200, type: [DashboardRecentInstallationItemDto] })
  async getRecentInstallations(@Query('limit') limit?: string): Promise<DashboardRecentInstallationItemDto[]> {
    const l = limit ? Number(limit) : undefined;
    return this.dashboard.getRecentInstallations({ limit: Number.isFinite(l as number) ? (l as number) : undefined });
  }
}

