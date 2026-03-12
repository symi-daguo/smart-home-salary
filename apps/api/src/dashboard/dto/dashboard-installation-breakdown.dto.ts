import { ApiProperty } from '@nestjs/swagger';

export class DashboardInstallationBreakdownItemDto {
  @ApiProperty({ description: '品类（Product.category）', example: '开关类' })
  category!: string;

  @ApiProperty({ description: '数量汇总（按 installationRecords.quantity 求和）', example: 42 })
  quantity!: number;
}

