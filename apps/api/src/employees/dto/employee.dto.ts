import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: '手机号（用于后续 iOS 登录绑定）' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: '岗位ID' })
  @IsString()
  @IsNotEmpty()
  positionId!: string;

  @ApiPropertyOptional({
    description: '员工类型ID（用于 Skill/路由挂载，可选）',
  })
  @IsOptional()
  @IsString()
  employeeTypeId?: string;

  @ApiProperty({ description: '入职日期（YYYY-MM-DD）' })
  @IsDateString()
  entryDate!: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional({ description: '绑定到租户成员关系（Membership ID）' })
  @IsOptional()
  @IsString()
  membershipId?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  positionId?: string;

  @ApiPropertyOptional({ description: '员工类型ID（可为空以清除）' })
  @IsOptional()
  @IsString()
  employeeTypeId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @ApiPropertyOptional({ enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  status?: EmploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  membershipId?: string | null;
}

