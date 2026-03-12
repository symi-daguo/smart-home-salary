import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInstallationRecordDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: '技术人员ID' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ description: '商品ID' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ enum: ServiceType, description: '服务类型：安装/调试/售后' })
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({ description: '数量' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: '难度系数，普通1.0，复杂1.2，特殊1.5 等' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  difficultyFactor?: number;

  @ApiPropertyOptional({ description: '现场照片 URL 列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({ description: '施工说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '记录发生时间（默认当前时间）' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

/** 员工端 POST /my 专用：无需传 employeeId，服务端自动解析 */
export class CreateInstallationRecordMyDto extends OmitType(CreateInstallationRecordDto, ['employeeId'] as const) {}

export class UpdateInstallationRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  difficultyFactor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

