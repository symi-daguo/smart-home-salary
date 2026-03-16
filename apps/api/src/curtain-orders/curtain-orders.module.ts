import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { PrismaService } from '../common/prisma.service';
import { CurtainOrdersController } from './curtain-orders.controller';
import { CurtainOrdersService } from './curtain-orders.service';

@Module({
  imports: [RbacModule],
  controllers: [CurtainOrdersController],
  providers: [CurtainOrdersService, PrismaService],
  exports: [CurtainOrdersService],
})
export class CurtainOrdersModule {}
