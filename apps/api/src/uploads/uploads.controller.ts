import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('uploads')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('payment-proofs')
  @RequirePermissions('uploads.create')
  @ApiOperation({ summary: '上传收款凭证图片（返回可公开访问 URL）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiResponse({ status: 201 })
  async uploadPaymentProof(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.uploadSingle({
      file,
      kind: 'payment-proof',
      maxBytes: 5 * 1024 * 1024,
      allowedMime: /^image\/(jpeg|png|webp)$/,
    });
  }

  @Post('installation-photos')
  @RequirePermissions('uploads.create')
  @ApiOperation({ summary: '上传施工照片图片（返回可公开访问 URL）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiResponse({ status: 201 })
  async uploadInstallationPhoto(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.uploadSingle({
      file,
      kind: 'installation-photo',
      maxBytes: 5 * 1024 * 1024,
      allowedMime: /^image\/(jpeg|png|webp)$/,
    });
  }

  @Post('videos')
  @RequirePermissions('uploads.create')
  @ApiOperation({
    summary: '上传视频（建议 iOS 端压缩后再传；后端仅做大小/类型限制并返回 URL）',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  @ApiResponse({ status: 201 })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.uploadSingle({
      file,
      kind: 'generic',
      maxBytes: 50 * 1024 * 1024,
      allowedMime: /^video\/(mp4|quicktime)$/,
    });
  }

  @Post('warehouse-images')
  @RequirePermissions('uploads.create')
  @ApiOperation({ summary: '上传出入库单图片（v1.0.8 支持出入库单图片上传）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiResponse({ status: 201 })
  async uploadWarehouseImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploads.uploadSingle({
      file,
      kind: 'warehouse-image',
      maxBytes: 5 * 1024 * 1024,
      allowedMime: /^image\/(jpeg|png|webp)$/,
    });
  }
}

