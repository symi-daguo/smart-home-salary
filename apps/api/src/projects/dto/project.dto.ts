import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectItemInput {
  @ApiProperty({ description: '商品ID' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ description: '标准数量' })
  @IsNumber()
  @Min(0)
  standardQuantity!: number;

  @ApiPropertyOptional({ description: '标准单价（可覆盖商品标准价）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardPrice?: number;
}

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: '项目地址', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address!: string;

  @ApiProperty({ description: '客户姓名', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customerName!: string;

  @ApiProperty({
    description: '客户电话',
    example: '13800000000',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^1\d{10}$/, { message: '客户电话格式不正确，应为 1 开头的 11 位数字。' })
  customerPhone!: string;

  @ApiProperty({ description: '合同金额' })
  @IsNumber()
  @Min(0)
  contractAmount!: number;

  @ApiProperty({ description: '签订日期（YYYY-MM-DD）' })
  @IsDateString()
  signDate!: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: '项目服务费' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceFee?: number;

  @ApiPropertyOptional({ description: '签单折扣率（如0.85表示85折）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  signDiscountRate?: number;

  @ApiPropertyOptional({ description: '产品清单', type: [ProjectItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemInput)
  items?: ProjectItemInput[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: '项目名称', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '项目地址', maxLength: 200 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ description: '客户姓名', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  customerName?: string;

  @ApiPropertyOptional({
    description: '客户电话',
    example: '13800000000',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^1\d{10}$/, { message: '客户电话格式不正确，应为 1 开头的 11 位数字。' })
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  contractAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  signDate?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: '项目服务费' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceFee?: number;

  @ApiPropertyOptional({ description: '签单折扣率（如0.85表示85折）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  signDiscountRate?: number;

  @ApiPropertyOptional({ description: '覆盖产品清单（全量替换）', type: [ProjectItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemInput)
  items?: ProjectItemInput[];
}

