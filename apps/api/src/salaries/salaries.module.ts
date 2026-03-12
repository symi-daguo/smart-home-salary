import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';

@Module({
  imports: [RbacModule],
  controllers: [SalariesController],
  providers: [SalariesService],
})
export class SalariesModule {}

