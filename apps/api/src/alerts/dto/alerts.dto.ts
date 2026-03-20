import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListAlertsDto {
  @ApiPropertyOptional({ description: '项目ID（可选）' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: AlertSeverity, description: '严重级别（可选）' })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional({ description: '仅显示未处理预警（true/false，默认 false）' })
  @IsOptional()
  @IsString()
  unresolved?: string;
}

export class RunProjectCompareDto {
  @ApiPropertyOptional({
    description: '项目ID；不传则对当前租户所有项目运行一次（MVP 先支持单项目）',
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}
