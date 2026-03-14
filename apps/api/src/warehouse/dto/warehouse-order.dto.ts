import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, ValidateNested, IsArray, IsInt, Min, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { WarehouseOrderType, PaymentType } from './outbound-application.dto'

export class WarehouseOrderItemDto {
  @ApiProperty({ description: '产品ID' })
  @IsUUID()
  productId!: string

  @ApiProperty({ description: '数量', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number

  @ApiPropertyOptional({ description: 'SN码列表' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  snCodes?: string[]

  @ApiPropertyOptional({ description: '单价' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class CreateWarehouseOrderDto {
  @ApiProperty({ description: '单据类型', enum: WarehouseOrderType })
  @IsEnum(WarehouseOrderType)
  orderType!: WarehouseOrderType

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '关联出入库单ID' })
  @IsOptional()
  @IsUUID()
  relatedOrderId?: string

  @ApiPropertyOptional({ description: '发生时间' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string

  @ApiPropertyOptional({ description: '付款类型', enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @ApiPropertyOptional({ description: '快递单号' })
  @IsOptional()
  @IsString()
  expressNo?: string

  @ApiPropertyOptional({ description: '图片URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '明细', type: [WarehouseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WarehouseOrderItemDto)
  items?: WarehouseOrderItemDto[]
}

export class UpdateWarehouseOrderDto {
  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '关联出入库单ID' })
  @IsOptional()
  @IsUUID()
  relatedOrderId?: string

  @ApiPropertyOptional({ description: '发生时间' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string

  @ApiPropertyOptional({ description: '付款类型', enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @ApiPropertyOptional({ description: '快递单号' })
  @IsOptional()
  @IsString()
  expressNo?: string

  @ApiPropertyOptional({ description: '图片URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '明细', type: [WarehouseOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WarehouseOrderItemDto)
  items?: WarehouseOrderItemDto[]
}

export class QueryWarehouseOrderDto {
  @ApiPropertyOptional({ description: '单据类型', enum: WarehouseOrderType })
  @IsOptional()
  @IsEnum(WarehouseOrderType)
  orderType?: WarehouseOrderType

  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '产品名称（模糊搜索）' })
  @IsOptional()
  @IsString()
  productName?: string

  @ApiPropertyOptional({ description: 'SN码（模糊搜索）' })
  @IsOptional()
  @IsString()
  snCode?: string

  @ApiPropertyOptional({ description: '备注（模糊搜索）' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string
}
