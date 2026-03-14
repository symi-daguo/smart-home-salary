import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({ description: '岗位名称', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ description: '底薪（月）' })
  @IsNumber()
  @Min(0)
  baseSalary!: number;

  @ApiProperty({
    description: '提成规则（JSON），例如 tiers/discount_rules',
    type: Object,
  })
  @IsObject()
  commissionRule!: Record<string, any>;

  @ApiPropertyOptional({ description: '奖金规则（JSON）', type: Object })
  @IsOptional()
  @IsObject()
  bonusRule?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  phoneAllowance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportAllowance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowance?: number;
}

export class UpdatePositionDto {
  @ApiPropertyOptional({ description: '岗位名称', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  commissionRule?: Record<string, any>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  bonusRule?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  phoneAllowance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportAllowance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowance?: number;
}

