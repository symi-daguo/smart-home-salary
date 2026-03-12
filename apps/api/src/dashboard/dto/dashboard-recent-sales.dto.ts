import { ApiProperty } from '@nestjs/swagger';

export class DashboardRecentSalesItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: '项目名称' })
  projectName!: string;

  @ApiProperty({ description: '员工姓名' })
  employeeName!: string;

  @ApiProperty({ description: '金额' })
  amount!: number;

  @ApiProperty({ description: '发生时间（ISO）' })
  occurredAt!: string;
}

