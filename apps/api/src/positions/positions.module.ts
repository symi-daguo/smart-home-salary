import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

@Module({
  imports: [RbacModule],
  controllers: [PositionsController],
  providers: [PositionsService],
})
export class PositionsModule {}

