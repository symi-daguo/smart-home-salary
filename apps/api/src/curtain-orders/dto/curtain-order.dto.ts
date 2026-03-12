import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CurtainRoomDto {
  @ApiProperty({ description: '房间名称' })
  @IsString()
  @IsNotEmpty()
  roomName!: string;

  @ApiProperty({ description: '窗帘详情（复杂结构暂以 JSON 保存，后续可细化为字段）' })
  @IsObject()
  detail!: Record<string, any>;

  @ApiPropertyOptional({ description: '媒体 URL（图片/视频）', type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateCurtainOrderDto {
  @ApiProperty({ description: '关联项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: '电动窗帘房间数量' })
  @IsInt()
  @Min(1)
  roomCount!: number;

  @ApiPropertyOptional({ description: '是否送货上门' })
  @IsOptional()
  @IsBoolean()
  deliveryToDoor?: boolean;

  @ApiPropertyOptional({ description: '货物接收人姓名（送货上门时）' })
  @IsOptional()
  @IsString()
  receiverName?: string;

  @ApiPropertyOptional({ description: '送货地址（不送货上门时可填写仓库/地址）' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: '是否第三方安装' })
  @IsOptional()
  @IsBoolean()
  thirdPartyInstall?: boolean;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '房间窗帘信息列表（长度应与 roomCount 一致）', type: [CurtainRoomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurtainRoomDto)
  rooms!: CurtainRoomDto[];
}

