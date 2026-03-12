import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeTypeDto {
  @ApiProperty({ description: '类型 key（用于路由与技能挂载），例如 sales/technician/pm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  key!: string;

  @ApiProperty({ description: '显示名称，例如 销售/安装工程师/项目经理' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Skill 标签数组（可选），用于 OpenClaw 侧挂载/过滤 skills，例如 ["member","sales"]',
  })
  @IsOptional()
  skillTags?: string[];
}

export class UpdateEmployeeTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  skillTags?: string[] | null;
}

