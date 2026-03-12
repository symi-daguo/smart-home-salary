import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional({ description: '模糊搜索关键字（name contains, case-insensitive）' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: '返回数量上限（用于候选<=3 的最小确认策略）', default: 50 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

