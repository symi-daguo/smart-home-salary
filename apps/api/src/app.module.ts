import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { BillingModule } from './billing/billing.module';
import { CacheModule } from './cache/cache.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';
import { EmployeeTypesModule } from './employee-types/employee-types.module';
import { ProductsModule } from './products/products.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { ProjectsModule } from './projects/projects.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { InstallationRecordsModule } from './installation-records/installation-records.module';
import { AlertsModule } from './alerts/alerts.module';
import { SalariesModule } from './salaries/salaries.module';
import { ExcelModule } from './excel/excel.module';
import { UploadsModule } from './uploads/uploads.module';
import { MeasurementSurveysModule } from './measurement-surveys/measurement-surveys.module';
import { CurtainOrdersModule } from './curtain-orders/curtain-orders.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { CommonModule } from './common/common.module';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { HttpMetricsInterceptor } from './metrics/interceptors/http-metrics.interceptor';
import { HttpLoggingInterceptor } from './logger/interceptors/http-logging.interceptor';
import { DashboardModule } from './dashboard/dashboard.module';
import { OpenclawModule } from './openclaw/openclaw.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: config.get<number>('RATE_LIMIT_LIMIT', 100),
        },
      ],
    }),
    CacheModule,
    LoggerModule,
    MetricsModule,
    TracingModule,
    HealthModule,
    NotificationsModule,
    CommonModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    MembershipsModule,
    RbacModule,
    AuditModule,
    BillingModule,
    FeatureFlagsModule,
    PositionsModule,
    EmployeesModule,
    EmployeeTypesModule,
    ProductsModule,
    ProductCategoriesModule,
    ProjectsModule,
    SalesOrdersModule,
    InstallationRecordsModule,
    AlertsModule,
    SalariesModule,
    ExcelModule,
    UploadsModule,
    MeasurementSurveysModule,
    CurtainOrdersModule,
    WarehouseModule,
    DashboardModule,
    OpenclawModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
