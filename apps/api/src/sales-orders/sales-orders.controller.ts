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
import { CreateSalesOrderDto, CreateSalesOrderMyDto, UpdateSalesOrderDto } from './dto/sales-order.dto';
import { PrismaService } from '../common/prisma.service';
import type { Request } from 'express';
import { SalesOrdersService } from './sales-orders.service';

@ApiTags('Sales Orders')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('sales-orders')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class SalesOrdersController {
  constructor(
    private readonly salesOrders: SalesOrdersService,
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
      throw new UnauthorizedException('当前用户未绑定员工档案，无法上报销售数据');
    }
    return membership.employee.id;
  }

  @Get()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '销售订单列表' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.salesOrders.list();
  }

  @Get('my')
  @RequirePermissions('sales.read')
  @ApiOperation({ summary: '当前员工自己的销售订单列表' })
  async listMy(@Req() req: Request) {
    const employeeId = await this.resolveCurrentEmployeeId(req);
    return this.salesOrders.listForEmployee(employeeId);
  }

  @Get(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '获取销售订单详情（含明细）' })
  async get(@Param('id') id: string) {
    return this.salesOrders.get(id);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '创建销售订单（可同时提交商品明细）' })
  async create(@Body() dto: CreateSalesOrderDto) {
    return this.salesOrders.create(dto);
  }

  @Post('my')
  @RequirePermissions('sales.create')
  @ApiOperation({ summary: '当前员工上报销售订单（无需 employeeId，服务端自动解析）' })
  async createMy(@Req() req: Request, @Body() dto: CreateSalesOrderMyDto) {
    const employeeId = await this.resolveCurrentEmployeeId(req);
    return this.salesOrders.createForEmployee(employeeId, dto);
  }

  @Put(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '更新销售订单（如提供 items 则覆盖明细）' })
  async update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.salesOrders.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除销售订单（及其商品明细）' })
  async remove(@Param('id') id: string) {
    return this.salesOrders.remove(id);
  }
}

