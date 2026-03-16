import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMeasurementSurveyDto {
  @ApiProperty({ description: '关联项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiPropertyOptional({ description: '记录时间（ISO），不填则使用当前时间' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '媒体 URL 列表（图片/视频），由 uploads 接口返回的 url 组成', type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class UpdateMeasurementSurveyDto {
  @ApiPropertyOptional({ description: '关联项目 ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '记录时间（ISO）' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string | null;

  @ApiPropertyOptional({ description: '媒体 URL 列表', type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[] | null;
}

