import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';

@Module({
  imports: [RbacModule],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}

