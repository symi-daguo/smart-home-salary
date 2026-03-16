import { Module } from '@nestjs/common'
import { WarehouseController } from './warehouse.controller'
import { WarehouseService } from './warehouse.service'
import { PrismaService } from '../common/prisma.service'
import { RbacModule } from '../rbac/rbac.module'

@Module({
  imports: [RbacModule],
  controllers: [WarehouseController],
  providers: [WarehouseService, PrismaService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
