import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateCurtainOrderDto, UpdateCurtainOrderDto, CalculateCurtainPriceDto, CurtainPriceResultDto } from './dto/curtain-order.dto';
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
  async list(@Query('projectId') projectId?: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.orders.list(projectId, tenantId);
  }

  @Get(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '获取窗帘订单详情' })
  @ApiResponse({ status: 200 })
  async getById(@Param('id') id: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.orders.getById(id, tenantId);
  }

  @Post('calculate-price')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '计算窗帘价格（v1.0.8 自动计算）' })
  @ApiResponse({ status: 200, type: CurtainPriceResultDto })
  async calculatePrice(@Body() dto: CalculateCurtainPriceDto, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.orders.calculatePrice(dto, tenantId);
  }

  @Post()
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '新增窗帘下单（含房间信息，v1.0.8 支持自动计算价格和生成出库单）' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateCurtainOrderDto, @Request() req: any) {
    // 从请求中获取当前用户ID作为操作员ID
    const operatorId = req.user?.employeeId;
    const tenantId = req?.tenantId;
    return this.orders.create({
      ...dto,
      operatorId,
    }, tenantId);
  }

  @Patch(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '更新窗帘下单' })
  @ApiResponse({ status: 200 })
  async update(@Param('id') id: string, @Body() dto: UpdateCurtainOrderDto, @Request() req: any) {
    const operatorId = req.user?.employeeId;
    const tenantId = req?.tenantId;
    
    // 将 UpdateCurtainOrderDto 转换为 CreateCurtainOrderDto 格式
    const updateData: any = {
      ...dto,
      operatorId,
    };
    
    // 确保 projectId 有值（从 DTO 或从现有记录）
    if (!updateData.projectId) {
      // 如果 DTO 中没有 projectId，需要从服务中获取现有记录
      const existing = await this.orders.getById(id, tenantId);
      updateData.projectId = existing.projectId;
    }
    
    // 确保 roomCount 有值
    if (!updateData.roomCount) {
      const existing = await this.orders.getById(id, tenantId);
      updateData.roomCount = existing.roomCount;
    }
    
    return this.orders.update(id, updateData, tenantId);
  }

  @Delete(':id')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '删除窗帘下单' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string, @Request() req?: any) {
    const tenantId = req?.tenantId;
    return this.orders.remove(id, tenantId);
  }
}
