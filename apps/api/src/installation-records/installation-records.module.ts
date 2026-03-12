import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { InstallationRecordsController } from './installation-records.controller';
import { InstallationRecordsService } from './installation-records.service';

@Module({
  imports: [RbacModule],
  controllers: [InstallationRecordsController],
  providers: [InstallationRecordsService],
})
export class InstallationRecordsModule {}

