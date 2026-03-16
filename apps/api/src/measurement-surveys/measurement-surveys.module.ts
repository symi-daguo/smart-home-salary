import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { PrismaService } from '../common/prisma.service';
import { MeasurementSurveysController } from './measurement-surveys.controller';
import { MeasurementSurveysService } from './measurement-surveys.service';

@Module({
  imports: [RbacModule],
  controllers: [MeasurementSurveysController],
  providers: [MeasurementSurveysService, PrismaService],
  exports: [MeasurementSurveysService],
})
export class MeasurementSurveysModule {}
