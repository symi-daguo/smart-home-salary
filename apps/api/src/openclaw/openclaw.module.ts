import { Module } from '@nestjs/common';
import { OpenclawController } from './openclaw.controller';
import { OpenclawService } from './openclaw.service';
import { PrismaService } from '../common/prisma.service';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';

@Module({
  controllers: [OpenclawController],
  providers: [OpenclawService, PrismaService, TenantContextService],
  exports: [OpenclawService],
})
export class OpenclawModule {}
