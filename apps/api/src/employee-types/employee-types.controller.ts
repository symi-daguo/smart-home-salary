import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CreateEmployeeTypeDto, UpdateEmployeeTypeDto } from './dto/employee-type.dto';
import { EmployeeTypesService } from './employee-types.service';

@ApiTags('Employee Types')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('employee-types')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class EmployeeTypesController {
  constructor(private readonly employeeTypes: EmployeeTypesService) {}

  @Get()
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '员工类型列表（用于 Skill 挂载/路由）' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.employeeTypes.list();
  }

  @Get(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '员工类型详情' })
  async get(@Param('id') id: string) {
    return this.employeeTypes.get(id);
  }

  @Post()
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '创建员工类型（含 skillTags）' })
  async create(@Body() dto: CreateEmployeeTypeDto) {
    return this.employeeTypes.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '更新员工类型' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeTypeDto) {
    return this.employeeTypes.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '删除员工类型' })
  async remove(@Param('id') id: string) {
    return this.employeeTypes.remove(id);
  }
}

