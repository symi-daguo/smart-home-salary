import { IsOptional, IsString, MaxLength, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const Plan = {
  FREE: 'FREE',
  PRO: 'PRO',
} as const;

const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

type PlanType = (typeof Plan)[keyof typeof Plan];
type TenantStatusType = (typeof TenantStatus)[keyof typeof TenantStatus];

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'New Name', maxLength: 100, description: 'Organization name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: ['FREE', 'PRO'], description: 'Subscription plan' })
  @IsOptional()
  @IsEnum(Plan)
  plan?: PlanType;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED'], description: 'Tenant status' })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatusType;

  @ApiPropertyOptional({
    example: 'acme001',
    description: '所属公司标识（仅限字母或数字，登录时使用），修改后所有员工需使用新的标识登录',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9]+$/, {
    message: '所属公司标识只能包含英文字母或数字',
  })
  slug?: string;
}
