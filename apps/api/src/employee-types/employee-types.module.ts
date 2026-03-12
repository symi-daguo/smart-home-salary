import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { EmployeeTypesController } from './employee-types.controller';
import { EmployeeTypesService } from './employee-types.service';

@Module({
  imports: [RbacModule],
  controllers: [EmployeeTypesController],
  providers: [EmployeeTypesService],
})
export class EmployeeTypesModule {}

