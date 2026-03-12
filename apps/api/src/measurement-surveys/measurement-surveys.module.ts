import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { MeasurementSurveysController } from './measurement-surveys.controller';
import { MeasurementSurveysService } from './measurement-surveys.service';

@Module({
  imports: [RbacModule],
  controllers: [MeasurementSurveysController],
  providers: [MeasurementSurveysService],
})
export class MeasurementSurveysModule {}

