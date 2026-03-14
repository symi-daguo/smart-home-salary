import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: '商品名称', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: '商品分类，如：开关类、窗帘类等', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @ApiProperty({ description: '标准销售价格' })
  @IsNumber()
  @Min(0)
  standardPrice!: number;

  @ApiProperty({ description: '标准安装费' })
  @IsNumber()
  @Min(0)
  installationFee!: number;

  @ApiPropertyOptional({ description: '调试费' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  debuggingFee?: number;

  @ApiPropertyOptional({ description: '其他附加费用' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherFee?: number;

  @ApiPropertyOptional({ description: '维保押金' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceDeposit?: number;

  @ApiPropertyOptional({ description: '是否特殊安装' })
  @IsOptional()
  @IsBoolean()
  isSpecialInstallation?: boolean;

  @ApiPropertyOptional({ description: '建议库存数量（可选，默认 0）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  suggestedStockQty?: number;

  @ApiPropertyOptional({ description: '技术安装提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionInstall?: number;

  @ApiPropertyOptional({ description: '技术调试提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionDebug?: number;

  @ApiPropertyOptional({ description: '技术维保提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionMaintenance?: number;

  @ApiPropertyOptional({ description: '技术售后提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionAfterSales?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ description: '商品名称', maxLength: 100 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '商品分类', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  installationFee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  debuggingFee?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherFee?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceDeposit?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSpecialInstallation?: boolean;

  @ApiPropertyOptional({ description: '建议库存数量（可选）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  suggestedStockQty?: number;

  @ApiPropertyOptional({ description: '技术安装提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionInstall?: number | null;

  @ApiPropertyOptional({ description: '技术调试提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionDebug?: number | null;

  @ApiPropertyOptional({ description: '技术维保提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionMaintenance?: number | null;

  @ApiPropertyOptional({ description: '技术售后提成金额（单件）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  techCommissionAfterSales?: number | null;
}

