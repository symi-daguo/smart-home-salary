import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, static as expressStatic, urlencoded } from 'express';
import helmet from 'helmet';
import path from 'path';
import { promises as fs } from 'fs';

async function ensureDesktopSqliteSeed() {
  const databaseUrl = String(process.env.DATABASE_URL || '');
  if (!databaseUrl.startsWith('file:')) return;

  const filePath = databaseUrl.slice('file:'.length);
  if (!filePath) return;

  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  const seedDb = String(process.env.DESKTOP_SEED_DB || '');
  if (!seedDb) return;

  const seedAbs = path.isAbsolute(seedDb) ? seedDb : path.resolve(process.cwd(), seedDb);

  await fs.mkdir(path.dirname(abs), { recursive: true });

  try {
    await fs.access(seedAbs);
  } catch {
    console.error('Seed database not found at:', seedAbs);
    return;
  }

  try {
    const srcStats = await fs.stat(seedAbs);
    const destStats = await fs.stat(abs).catch(() => null);

    const shouldCopy = !destStats || destStats.size === 0 || srcStats.size > destStats.size;

    if (shouldCopy) {
      console.log('Copying seed database to:', abs);
      await fs.copyFile(seedAbs, abs);
      console.log('Seed database copied successfully');
    } else {
      console.log('Database already exists, skipping seed copy');
    }
  } catch (e) {
    console.error('Error checking/copying seed database:', e);
    try {
      await fs.copyFile(seedAbs, abs);
    } catch (copyError) {
      console.error('Failed to copy seed database:', copyError);
    }
  }
}

async function bootstrap() {
  await ensureDesktopSqliteSeed();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.disable?.('x-powered-by');

  // If behind a reverse proxy / load balancer (recommended in production)
  expressApp.set?.('trust proxy', 1);

  // Security headers (prefer doing TLS + HSTS at the edge; this still helps)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow public MinIO assets if used
    }),
  );

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const uploadsDir = configService.get<string>('UPLOADS_DIR', '');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '');
  const frontendUrl = configService.get<string>('FRONTEND_URL', '');
  const allowOrigins = [corsOrigin, frontendUrl]
    .flatMap((x) => String(x || '').split(','))
    .map((x) => x.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowOrigins.length ? allowOrigins : nodeEnv !== 'production',
    credentials: true,
  });

  const swaggerEnabledRaw = configService.get<string>('SWAGGER_ENABLED', '');
  const swaggerEnabled =
    swaggerEnabledRaw !== ''
      ? swaggerEnabledRaw === 'true'
      : nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Multi-Tenant SaaS API')
      .setDescription(
        'Production-ready NestJS API with multi-tenancy, authentication, RBAC, billing, and more.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Tenant-ID',
          in: 'header',
          description: 'Tenant ID for multi-tenant operations',
        },
        'X-Tenant-ID',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Tenants', 'Tenant/Organization management')
      .addTag('Users', 'User profile management')
      .addTag('Memberships', 'Team membership and invitations')
      .addTag('Feature Flags', 'Feature flag management')
      .addTag('Billing', 'Subscription and billing management')
      .addTag('Audit', 'Audit log queries')
      .addTag('Positions', '岗位管理')
      .addTag('Employees', '员工管理')
      .addTag('Employee Types', '员工类型（Skill 挂载/路由）')
      .addTag('Products', '商品管理')
      .addTag('Product Categories', '商品分类与推荐费用')
      .addTag('Projects', '项目管理')
      .addTag('Sales Orders', '销售订单')
      .addTag('Installation Records', '技术安装/调试/售后记录')
      .addTag('Alerts', '预警中心')
      .addTag('Salaries', '工资结算')
      .addTag('Excel', 'Excel 导入导出')
      .addTag('Uploads', '图片/视频上传（MinIO/S3）')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  const port = configService.get<number>('PORT', 3000);

  // Desktop/offline mode: serve local uploaded files.
  // `UploadsService` will return `/uploads/...` URLs when `UPLOADS_DIR` is set.
  if (uploadsDir) {
    const abs = path.isAbsolute(uploadsDir) ? uploadsDir : path.resolve(process.cwd(), uploadsDir);
    expressApp.use('/uploads', expressStatic(abs, { maxAge: '365d', immutable: true }));
  }

  await app.listen(port);
  console.info(`API listening on http://localhost:${port}`);
  if (swaggerEnabled) console.info(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
