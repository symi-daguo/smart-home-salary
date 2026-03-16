import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsObject } from 'class-validator';

export enum InputType {
  VOICE = 'voice',
  TEXT = 'text',
}

export enum IntentType {
  SALES_REPORT = 'sales_report',
  TECH_REPORT = 'tech_report',
  SALARY_QUERY = 'salary_query',
  PROJECT_QUERY = 'project_query',
  PRODUCT_QUERY = 'product_query',
  UNKNOWN = 'unknown',
}

export class VoiceInputDto {
  @ApiProperty({ description: '输入类型', enum: InputType })
  @IsEnum(InputType)
  type!: InputType;

  @ApiProperty({ description: '语音或文字内容' })
  @IsString()
  content!: string;

  @ApiProperty({ description: '员工ID', required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class ParsedIntentDto {
  @ApiProperty({ description: '识别出的意图', enum: IntentType })
  @IsEnum(IntentType)
  intent!: IntentType;

  @ApiProperty({ description: '置信度', example: 0.95 })
  @IsNumber()
  confidence!: number;

  @ApiProperty({ description: '解析出的实体' })
  @IsObject()
  entities!: Record<string, any>;

  @ApiProperty({ description: '缺失的字段', type: [String] })
  @IsString({ each: true })
  missingFields!: string[];

  @ApiProperty({ description: '建议的追问', required: false })
  @IsOptional()
  @IsString()
  suggestedQuestion?: string;
}

export class FormSummaryDto {
  @ApiProperty({ description: '表单类型' })
  @IsString()
  formType!: string;

  @ApiProperty({ description: '表单数据' })
  @IsObject()
  data!: Record<string, any>;

  @ApiProperty({ description: '人类可读的摘要' })
  @IsString()
  summary!: string;
}
