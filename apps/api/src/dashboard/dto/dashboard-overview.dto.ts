import { ApiProperty } from '@nestjs/swagger';

export class DashboardOverviewDto {
  @ApiProperty({ description: '本月总营收（按销售订单 amount 汇总）', example: 45231.89 })
  totalRevenueThisMonth!: number;

  @ApiProperty({ description: '本月新增销售订单数量', example: 235 })
  salesOrderCountThisMonth!: number;

  @ApiProperty({ description: '当前在职员工数量', example: 12 })
  activeEmployeeCount!: number;

  @ApiProperty({ description: '待处理预警数量（未设置 resolvedAt）', example: 3 })
  pendingAlertCount!: number;
}

