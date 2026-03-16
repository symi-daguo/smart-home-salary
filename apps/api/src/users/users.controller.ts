import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
@ApiSecurity('X-Tenant-ID')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@CurrentUser() user: { sub: string }) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@CurrentUser() user: { sub: string }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.sub, dto);
  }

  // 管理员功能：获取租户下所有用户
  @Get()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: '获取租户下所有用户（管理员）' })
  @ApiResponse({ status: 200, description: '用户列表' })
  async findAll(@Request() req: any) {
    const tenantId = req.tenantId;
    return this.usersService.findAllByTenant(tenantId);
  }

  // 管理员功能：创建用户
  @Post()
  @RequirePermissions('users.invite')
  @ApiOperation({ summary: '创建新用户（管理员）' })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  async create(@Body() dto: {
    email: string;
    displayName?: string;
    password: string;
    roles: string[];
    isActive?: boolean;
  }, @Request() req: any) {
    const tenantId = req.tenantId;
    return this.usersService.createUser(tenantId, dto);
  }

  // 管理员功能：更新用户
  @Patch(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: '更新用户信息（管理员）' })
  @ApiResponse({ status: 200, description: '用户更新成功' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: {
      displayName?: string;
      roles?: string[];
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
    const tenantId = req.tenantId;
    return this.usersService.updateUser(tenantId, id, dto);
  }

  // 管理员功能：删除用户
  @Delete(':id')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: '删除用户（管理员）' })
  @ApiResponse({ status: 200, description: '用户删除成功' })
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.tenantId;
    return this.usersService.deleteUser(tenantId, id);
  }

  // 管理员功能：重置密码
  @Post(':id/reset-password')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: '重置用户密码（管理员）' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  async resetPassword(@Param('id') id: string) {
    return this.usersService.resetPassword(id);
  }
}
