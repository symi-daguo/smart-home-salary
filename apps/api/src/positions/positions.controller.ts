import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';
import { PositionsService } from './positions.service';

@ApiTags('Positions')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('positions')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get()
  @RequirePermissions('positions.manage')
  @ApiOperation({ summary: '岗位列表' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.positions.list();
  }

  @Get(':id')
  @RequirePermissions('positions.manage')
  @ApiOperation({ summary: '获取岗位详情' })
  async get(@Param('id') id: string) {
    return this.positions.get(id);
  }

  @Post()
  @RequirePermissions('positions.manage')
  @ApiOperation({ summary: '创建岗位' })
  async create(@Body() dto: CreatePositionDto) {
    return this.positions.create(dto);
  }

  @Put(':id')
  @RequirePermissions('positions.manage')
  @ApiOperation({ summary: '更新岗位' })
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.positions.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('positions.manage')
  @ApiOperation({ summary: '删除岗位' })
  async remove(@Param('id') id: string) {
    return this.positions.remove(id);
  }
}

