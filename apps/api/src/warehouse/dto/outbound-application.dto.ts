import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, ValidateNested, IsArray, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export enum OutboundApplicationType {
  SALES_PRE = 'SALES_PRE',
  TECH_PRE = 'TECH_PRE',
}

export enum OutboundApplicationStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONVERTED = 'CONVERTED',
}

export enum WarehouseOrderType {
  OUTBOUND_SALES = 'OUTBOUND_SALES',
  OUTBOUND_LOAN = 'OUTBOUND_LOAN',
  OUTBOUND_AFTER_SALES = 'OUTBOUND_AFTER_SALES',
  OUTBOUND_LOST = 'OUTBOUND_LOST',
  INBOUND_SALES = 'INBOUND_SALES',
  INBOUND_PURCHASE = 'INBOUND_PURCHASE',
  INBOUND_AFTER_SALES = 'INBOUND_AFTER_SALES',
  INBOUND_UNKNOWN = 'INBOUND_UNKNOWN',
}

export enum PaymentType {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  NEED_RETURN = 'NEED_RETURN',
  RETURN_LATER = 'RETURN_LATER',
  ON_ACCOUNT = 'ON_ACCOUNT',
  GIFT = 'GIFT',
  DESTROYED = 'DESTROYED',
}

export class OutboundApplicationItemDto {
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

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class CreateOutboundApplicationDto {
  @ApiProperty({ description: '申请类型', enum: OutboundApplicationType })
  @IsEnum(OutboundApplicationType)
  type!: OutboundApplicationType

  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiProperty({ description: '申请明细', type: [OutboundApplicationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundApplicationItemDto)
  items!: OutboundApplicationItemDto[]
}

export class UpdateOutboundApplicationDto {
  @ApiPropertyOptional({ description: '关联项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '申请明细', type: [OutboundApplicationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundApplicationItemDto)
  items?: OutboundApplicationItemDto[]
}

export class QueryOutboundApplicationDto {
  @ApiPropertyOptional({ description: '申请类型', enum: OutboundApplicationType })
  @IsOptional()
  @IsEnum(OutboundApplicationType)
  type?: OutboundApplicationType

  @ApiPropertyOptional({ description: '状态', enum: OutboundApplicationStatus })
  @IsOptional()
  @IsEnum(OutboundApplicationStatus)
  status?: OutboundApplicationStatus

  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string

  @ApiPropertyOptional({ description: '申请人ID' })
  @IsOptional()
  @IsUUID()
  applicantId?: string

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

export class ApproveOutboundApplicationDto {
  @ApiProperty({ description: '出库类型', enum: WarehouseOrderType })
  @IsEnum([
    WarehouseOrderType.OUTBOUND_SALES,
    WarehouseOrderType.OUTBOUND_LOAN,
    WarehouseOrderType.OUTBOUND_AFTER_SALES,
  ])
  orderType!: WarehouseOrderType

  @ApiPropertyOptional({ description: '付款类型', enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '修改的明细', type: [OutboundApplicationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundApplicationItemDto)
  items?: OutboundApplicationItemDto[]
}
