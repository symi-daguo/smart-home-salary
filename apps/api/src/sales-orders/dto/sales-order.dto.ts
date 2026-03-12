import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SalesOrderItemInput {
  @ApiProperty({ description: '商品ID' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ description: '数量' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: '标准单价（可选，默认取商品标准价）' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardPrice?: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ description: '项目ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: '销售员工ID' })
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ description: '实际收款金额' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ description: '折扣率，例如 0.95 / 0.9 / 0.85' })
  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate!: number;

  @ApiPropertyOptional({ description: '收款截图 URL 列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentProofUrls?: string[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '订单发生时间（默认当前时间）' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: '是否已核验到账（默认 false；用于结算口径）' })
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({ description: '订单商品明细', type: [SalesOrderItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemInput)
  items?: SalesOrderItemInput[];
}

/** 员工端 POST /my 专用：无需传 employeeId，服务端自动解析 */
export class CreateSalesOrderMyDto extends OmitType(CreateSalesOrderDto, ['employeeId'] as const) {}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  discountRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentProofUrls?: string[] | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: '是否已核验到账' })
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({ description: '覆盖商品明细（全量替换）', type: [SalesOrderItemInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesOrderItemInput)
  items?: SalesOrderItemInput[];
}

