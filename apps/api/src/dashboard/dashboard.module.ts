import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../common/prisma.service';
import { RbacModule } from '../rbac/rbac.module';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RbacService } from '../rbac/rbac.service';

@Module({
  imports: [RbacModule],
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService, RbacService, PermissionsGuard],
})
export class DashboardModule {}

