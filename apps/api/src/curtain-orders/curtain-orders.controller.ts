import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateCurtainOrderDto } from './dto/curtain-order.dto';
import { CurtainOrdersService } from './curtain-orders.service';

@ApiTags('CurtainOrders')
@ApiBearerAuth('JWT-auth')
@Controller('curtain-orders')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@ApiSecurity('X-Tenant-ID')
export class CurtainOrdersController {
  constructor(private readonly orders: CurtainOrdersService) {}

  @Get()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '窗帘下单列表（可按项目过滤）' })
  @ApiResponse({ status: 200 })
  async list(@Query('projectId') projectId?: string) {
    return this.orders.list(projectId);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '新增窗帘下单（含房间信息）' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateCurtainOrderDto) {
    return this.orders.create(dto);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除窗帘下单' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string) {
    return this.orders.remove(id);
  }
}

