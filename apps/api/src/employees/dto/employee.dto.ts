import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: '员工姓名', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @ApiProperty({
    description: '手机号（用于后续 iOS 登录绑定）',
    example: '13800000000',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确，应为 1 开头的 11 位数字。' })
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
  @ApiPropertyOptional({ description: '员工姓名', maxLength: 50 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: '手机号（用于后续 iOS 登录绑定）',
    example: '13800000000',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确，应为 1 开头的 11 位数字。' })
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

