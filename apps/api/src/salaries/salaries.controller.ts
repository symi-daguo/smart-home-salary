import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SalaryStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ListSalariesDto, SettleSalariesDto, UpdateSalaryDto, UpdateSalaryStatusDto } from './dto/salaries.dto';
import { SalariesService } from './salaries.service';
import { PrismaService } from '../common/prisma.service';
import type { Request } from 'express';

@ApiTags('Salaries')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('salaries')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class SalariesController {
  constructor(
    private readonly salaries: SalariesService,
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
      throw new UnauthorizedException('当前用户未绑定员工档案，无法查看工资');
    }
    return membership.employee.id;
  }

  @Post('settle')
  @RequirePermissions('salary.manage')
  @ApiOperation({ summary: '按月结算生成/更新工资单（MVP）' })
  @ApiResponse({ status: 201 })
  async settle(@Body() dto: SettleSalariesDto) {
    return this.salaries.settle(dto);
  }

  @Get()
  @RequirePermissions('salary.manage')
  @ApiOperation({ summary: '工资单列表（可按月份/员工/状态过滤）' })
  async list(@Query() query: ListSalariesDto) {
    return this.salaries.list({
      yearMonth: query.yearMonth,
      employeeId: query.employeeId,
      status: query.status as SalaryStatus | undefined,
    });
  }

  @Get('my')
  @RequirePermissions('salary.read.own')
  @ApiOperation({ summary: '当前员工自己的工资单列表' })
  async listMy(@Req() req: Request, @Query() query: ListSalariesDto) {
    const employeeId = await this.resolveCurrentEmployeeId(req);
    return this.salaries.list({
      yearMonth: query.yearMonth,
      employeeId,
      status: query.status as SalaryStatus | undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('salary.manage')
  @ApiOperation({ summary: '工资单详情' })
  async get(@Param('id') id: string) {
    return this.salaries.get(id);
  }

  @Patch(':id/status')
  @RequirePermissions('salary.manage')
  @ApiOperation({ summary: '更新工资单状态（APPROVED/PAID）' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateSalaryStatusDto) {
    return this.salaries.updateStatus(id, dto);
  }

  @Patch(':id')
  @RequirePermissions('salary.manage')
  @ApiOperation({ summary: '手动修正工资单数据' })
  async update(@Param('id') id: string, @Body() dto: UpdateSalaryDto) {
    return this.salaries.update(id, dto);
  }
}

