import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductCategoryDto {
  @ApiProperty({ description: '分类名称，例如：开关类/灯光类/门锁类' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: '推荐安装费（单个设备/节点），单位：元，作为参考值，可在商品中覆盖',
    example: 80,
  })
  @IsNumber()
  @Min(0)
  recommendedInstallationFee!: number;

  @ApiProperty({
    description: '推荐调试费（可选），单位：元',
    required: false,
    example: 40,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedDebuggingFee?: number;

  @ApiProperty({
    description: '推荐售后/其他服务费（可选），单位：元',
    required: false,
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedOtherFee?: number;

  @ApiProperty({
    description: '备注（可选），例如“参考设备价约 10%-20%”',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

export class UpdateProductCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedInstallationFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedDebuggingFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  recommendedOtherFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}

