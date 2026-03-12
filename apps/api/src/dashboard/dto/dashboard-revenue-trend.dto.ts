import { ApiProperty } from '@nestjs/swagger';

export class DashboardRevenueTrendPointDto {
  @ApiProperty({ description: '月份（YYYY-MM）', example: '2026-03' })
  month!: string;

  @ApiProperty({ description: '该月营收汇总（按销售订单 amount 求和）', example: 45231.89 })
  revenue!: number;
}

