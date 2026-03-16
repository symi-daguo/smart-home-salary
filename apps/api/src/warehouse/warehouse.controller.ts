import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { PermissionsGuard } from '../rbac/guards/permissions.guard'
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator'
import { CurrentTenant } from '../common/decorators/current-tenant.decorator'
import { WarehouseService } from './warehouse.service'
import {
  CreateOutboundApplicationDto,
  UpdateOutboundApplicationDto,
  QueryOutboundApplicationDto,
  ApproveOutboundApplicationDto,
} from './dto/outbound-application.dto'
import {
  CreateWarehouseOrderDto,
  UpdateWarehouseOrderDto,
  QueryWarehouseOrderDto,
  QueryWarehouseOrderLogDto,
} from './dto/warehouse-order.dto'

@ApiTags('仓库管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Post('outbound-applications')
  @ApiOperation({ summary: '创建出库申请单' })
  @RequirePermissions('warehouse.apply')
  async createOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Body('applicantId') applicantId: string,
    @Body() dto: CreateOutboundApplicationDto,
  ) {
    return this.service.createOutboundApplication(tenantId, applicantId, dto)
  }

  @Get('outbound-applications')
  @ApiOperation({ summary: '获取出库申请单列表' })
  @RequirePermissions('warehouse.apply', 'warehouse.review')
  async listOutboundApplications(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryOutboundApplicationDto,
  ) {
    return this.service.listOutboundApplications(tenantId, query)
  }

  @Get('outbound-applications/:id')
  @ApiOperation({ summary: '获取出库申请单详情' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.apply', 'warehouse.review')
  async getOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.getOutboundApplication(tenantId, id)
  }

  @Put('outbound-applications/:id')
  @ApiOperation({ summary: '更新出库申请单' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.apply')
  async updateOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOutboundApplicationDto,
  ) {
    return this.service.updateOutboundApplication(tenantId, id, dto)
  }

  @Delete('outbound-applications/:id')
  @ApiOperation({ summary: '删除出库申请单' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.apply')
  async deleteOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteOutboundApplication(tenantId, id)
  }

  @Post('outbound-applications/:id/submit')
  @ApiOperation({ summary: '提交出库申请单审核' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.apply')
  async submitOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.submitOutboundApplication(tenantId, id)
  }

  @Post('outbound-applications/:id/approve')
  @ApiOperation({ summary: '审核通过出库申请单' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.review')
  async approveOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Body('reviewerId') reviewerId: string,
    @Param('id') id: string,
    @Body() dto: ApproveOutboundApplicationDto,
  ) {
    return this.service.approveOutboundApplication(tenantId, reviewerId, id, dto)
  }

  @Post('outbound-applications/:id/reject')
  @ApiOperation({ summary: '拒绝出库申请单' })
  @ApiParam({ name: 'id', description: '申请单ID' })
  @RequirePermissions('warehouse.review')
  async rejectOutboundApplication(
    @CurrentTenant() tenantId: string,
    @Body('reviewerId') reviewerId: string,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.service.rejectOutboundApplication(tenantId, reviewerId, id, reason)
  }

  @Post('orders')
  @ApiOperation({ summary: '创建出入库单' })
  @RequirePermissions('warehouse.orders.manage')
  async createWarehouseOrder(
    @CurrentTenant() tenantId: string,
    @Body('operatorId') operatorId: string,
    @Body() dto: CreateWarehouseOrderDto,
  ) {
    return this.service.createWarehouseOrder(tenantId, operatorId, dto)
  }

  @Get('orders')
  @ApiOperation({ summary: '获取出入库单列表' })
  @RequirePermissions('warehouse.orders.manage', 'warehouse.inventory.read')
  async listWarehouseOrders(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryWarehouseOrderDto,
  ) {
    return this.service.listWarehouseOrders(tenantId, query)
  }

  @Get('orders/:id')
  @ApiOperation({ summary: '获取出入库单详情' })
  @ApiParam({ name: 'id', description: '出入库单ID' })
  @RequirePermissions('warehouse.orders.manage', 'warehouse.inventory.read')
  async getWarehouseOrder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.service.getWarehouseOrder(tenantId, id)
  }

  @Put('orders/:id')
  @ApiOperation({ summary: '更新出入库单' })
  @ApiParam({ name: 'id', description: '出入库单ID' })
  @RequirePermissions('warehouse.orders.manage')
  async updateWarehouseOrder(
    @CurrentTenant() tenantId: string,
    @Body('operatorId') operatorId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseOrderDto,
  ) {
    return this.service.updateWarehouseOrder(tenantId, operatorId, id, dto)
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: '删除出入库单' })
  @ApiParam({ name: 'id', description: '出入库单ID' })
  @RequirePermissions('warehouse.orders.manage')
  async deleteWarehouseOrder(
    @CurrentTenant() tenantId: string,
    @Body('operatorId') operatorId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteWarehouseOrder(tenantId, operatorId, id)
  }

  @Get('inventory')
  @ApiOperation({ summary: '获取库存列表' })
  @RequirePermissions('warehouse.inventory.read')
  async listInventory(@CurrentTenant() tenantId: string) {
    return this.service.listInventory(tenantId)
  }

  @Get('inventory/cost')
  @ApiOperation({ summary: '获取库存成本统计' })
  @RequirePermissions('warehouse.inventory.read')
  async getInventoryCost(@CurrentTenant() tenantId: string) {
    return this.service.getInventoryCost(tenantId)
  }

  @Post('inventory/adjust')
  @ApiOperation({ summary: '调整库存' })
  @RequirePermissions('warehouse.orders.manage')
  async adjustInventory(
    @CurrentTenant() tenantId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
    @Body('remark') remark?: string,
  ) {
    return this.service.adjustInventory(tenantId, productId, quantity, remark)
  }

  @Get('logs')
  @ApiOperation({ summary: '获取出入库单修改日志' })
  @RequirePermissions('warehouse.logs.read')
  async listWarehouseOrderLogs(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryWarehouseOrderLogDto,
  ) {
    return this.service.listWarehouseOrderLogs(tenantId, query)
  }
}
