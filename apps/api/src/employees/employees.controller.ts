import { Body, Controller, Delete, Get, Param, Post, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../common/prisma.service';
import type { Request } from 'express';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('employees')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class EmployeesController {
  constructor(
    private readonly employees: EmployeesService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCurrentEmployee(req: Request) {
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
      include: { employee: { include: { position: true, employeeType: true } } },
    });
    if (!membership?.employee) {
      throw new UnauthorizedException('当前用户未绑定员工档案');
    }
    return membership.employee;
  }

  @Get()
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '员工列表' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.employees.list();
  }

  @Get('my-profile')
  @RequirePermissions('employees.read.own')
  @ApiOperation({ summary: '获取当前用户绑定的员工档案（含员工类型 skillTags）' })
  async myProfile(@Req() req: Request) {
    const e = await this.resolveCurrentEmployee(req);
    // 最小化返回，便于 OpenClaw / iOS 路由使用
    return {
      id: e.id,
      name: e.name,
      phone: e.phone,
      position: e.position ? { id: e.position.id, name: e.position.name } : null,
      employeeType: e.employeeType
        ? {
            id: e.employeeType.id,
            key: e.employeeType.key,
            name: e.employeeType.name,
            skillTags: (e.employeeType.skillTags as any) ?? [],
          }
        : null,
    };
  }

  @Get(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '获取员工详情' })
  async get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '创建员工' })
  async create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Put(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '更新员工' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '删除员工' })
  async remove(@Param('id') id: string) {
    return this.employees.remove(id);
  }
}

