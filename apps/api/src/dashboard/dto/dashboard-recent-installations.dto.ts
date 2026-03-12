import { ApiProperty } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class DashboardRecentInstallationItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: '商品名称' })
  productName!: string;

  @ApiProperty({ description: '员工姓名' })
  employeeName!: string;

  @ApiProperty({ description: '服务类型' , enum: ServiceType})
  serviceType!: ServiceType;

  @ApiProperty({ description: '数量' })
  quantity!: number;

  @ApiProperty({ description: '发生时间（ISO）' })
  occurredAt!: string;
}

