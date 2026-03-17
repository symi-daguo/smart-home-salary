import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateInventoryCheckItemDto {
  @ApiProperty()
  @IsString()
  productId!: string

  @ApiProperty()
  @IsInt()
  @Min(0)
  systemQty!: number

  @ApiProperty()
  @IsInt()
  @Min(0)
  countedQty!: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string
}

export class CreateInventoryCheckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string

  @ApiProperty({ type: [CreateInventoryCheckItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryCheckItemDto)
  items!: CreateInventoryCheckItemDto[]
}

export class ApproveInventoryCheckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remark?: string
}

