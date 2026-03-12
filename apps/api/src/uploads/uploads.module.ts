import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RbacModule } from '../rbac/rbac.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [ConfigModule, RbacModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}

