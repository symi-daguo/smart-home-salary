import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { TenantContextService } from '../common/tenant-context/tenant-context.service';

type UploadKind = 'payment-proof' | 'installation-photo' | 'generic';

@Injectable()
export class UploadsService {
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly publicBaseUrl?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly tenantContext: TenantContextService,
  ) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('S3_BUCKET', 'salary-uploads');
    const publicBaseUrl = (this.config.get<string>('S3_PUBLIC_BASE_URL') ?? '').replace(/\/+$/, '');

    // 按需启用：测试环境或未配置对象存储时，不影响应用启动；仅在调用上传接口时报错
    if (endpoint && accessKeyId && secretAccessKey) {
      this.bucket = bucket;
      this.publicBaseUrl = publicBaseUrl;
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true, // MinIO 需要 path-style
      });
    }
  }

  async uploadSingle(params: {
    file: Express.Multer.File;
    kind: UploadKind;
    maxBytes: number;
    allowedMime: RegExp;
  }) {
    if (!this.s3 || !this.bucket) {
      throw new ServiceUnavailableException(
        '对象存储未配置：请设置 S3_ENDPOINT/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY/S3_BUCKET/S3_PUBLIC_BASE_URL',
      );
    }

    const { file, kind, maxBytes, allowedMime } = params;
    if (!file) throw new BadRequestException('缺少文件');
    if (file.size > maxBytes) {
      throw new BadRequestException(`文件过大，最大允许 ${Math.floor(maxBytes / (1024 * 1024))}MB`);
    }
    if (!allowedMime.test(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型：${file.mimetype}`);
    }

    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) throw new BadRequestException('缺少租户上下文');

    const ext = this.guessExt(file.originalname, file.mimetype);
    const objectKey = `${tenantId}/${kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (e: any) {
      throw new InternalServerErrorException(`上传失败：${e?.message ?? 'S3 error'}`);
    }

    const url = this.publicBaseUrl ? `${this.publicBaseUrl}/${objectKey}` : undefined;
    return { objectKey, url, contentType: file.mimetype, bytes: file.size };
  }

  private guessExt(originalName: string, mime: string) {
    const lower = originalName.toLowerCase();
    const idx = lower.lastIndexOf('.');
    if (idx > -1 && idx >= lower.length - 6) {
      const ext = lower.slice(idx);
      if (/^\.[a-z0-9]+$/.test(ext)) return ext;
    }
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'video/mp4') return '.mp4';
    if (mime === 'video/quicktime') return '.mov';
    return '';
  }
}

