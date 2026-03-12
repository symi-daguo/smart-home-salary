import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { CurtainOrdersController } from './curtain-orders.controller';
import { CurtainOrdersService } from './curtain-orders.service';

@Module({
  imports: [RbacModule],
  controllers: [CurtainOrdersController],
  providers: [CurtainOrdersService],
})
export class CurtainOrdersModule {}

