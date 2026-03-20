import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertCondition } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AlertRuleItemDto {
  @ApiProperty({ enum: AlertCondition, description: '规则条件类型' })
  @IsEnum(AlertCondition)
  condition!: AlertCondition;

  @ApiPropertyOptional({ description: '阈值（如折扣率阈值 0.85）', example: '0.85' })
  @IsOptional()
  @IsString()
  threshold?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpsertAlertRulesDto {
  @ApiProperty({ type: [AlertRuleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AlertRuleItemDto)
  rules!: AlertRuleItemDto[];
}
