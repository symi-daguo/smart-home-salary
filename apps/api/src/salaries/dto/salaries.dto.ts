import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryStatus } from '@prisma/client';
import { IsArray, IsEnum, IsNumber, IsObject, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SettleSalariesDto {
  @ApiProperty({ description: '结算月份，格式 YYYY-MM，例如 2026-03' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  yearMonth!: string;

  @ApiPropertyOptional({ description: '仅结算指定员工（可选）', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];

  @ApiPropertyOptional({
    description: '扣款（可选），key=employeeId，value=金额（单位元）',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  penalties?: Record<string, number>;
}

export class ListSalariesDto {
  @ApiPropertyOptional({ description: '结算月份 YYYY-MM（可选）' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  yearMonth?: string;

  @ApiPropertyOptional({ description: '员工ID（可选）' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ enum: SalaryStatus, description: '状态（可选）' })
  @IsOptional()
  @IsEnum(SalaryStatus)
  status?: SalaryStatus;
}

export class UpdateSalaryStatusDto {
  @ApiProperty({ enum: SalaryStatus, description: '状态：APPROVED 或 PAID' })
  @IsEnum(SalaryStatus)
  status!: SalaryStatus;

  @ApiPropertyOptional({ description: '发放日期（PAID 时可选，ISO 字符串）' })
  @IsOptional()
  @IsString()
  paidDate?: string;
}

export class UpdateSalaryDto {
  @ApiPropertyOptional({ description: '底薪' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional({ description: '销售提成' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salesCommission?: number;

  @ApiPropertyOptional({ description: '技术费' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  technicalFee?: number;

  @ApiPropertyOptional({ description: '补贴' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiPropertyOptional({ description: '扣款' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  penalty?: number;
}

