import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RbacModule } from '../rbac/rbac.module';
import { RbacService } from '../rbac/rbac.service';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@Module({
  imports: [RbacModule],
  controllers: [TenantsController],
  // 显式提供 RBAC 相关依赖，避免 guard 在该模块上下文解析失败
  providers: [TenantsService, PrismaService, TenantContextService, TenantGuard, RbacService, PermissionsGuard],
  exports: [TenantsService],
})
export class TenantsModule {}
