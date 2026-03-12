import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';
import { SearchQueryDto } from '../common/dto/search.dto';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('projects')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @RequirePermissions('projects.manage', 'projects.read')
  @ApiOperation({ summary: '项目列表' })
  @ApiResponse({ status: 200 })
  async list(@Query() query: SearchQueryDto) {
    return this.projects.list({ q: query.q, limit: query.limit });
  }

  @Get(':id')
  @RequirePermissions('projects.manage', 'projects.read')
  @ApiOperation({ summary: '获取项目详情（含标准产品清单）' })
  async get(@Param('id') id: string) {
    return this.projects.get(id);
  }

  @Post()
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '创建项目（可同时提交产品清单）' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }

  @Put(':id')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '更新项目（如提供 items 则覆盖清单）' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '删除项目（及其标准产品清单）' })
  async remove(@Param('id') id: string) {
    return this.projects.remove(id);
  }
}

