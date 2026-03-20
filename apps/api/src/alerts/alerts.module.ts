import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';

@Module({
  imports: [RbacModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
