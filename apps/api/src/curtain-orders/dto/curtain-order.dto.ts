import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CurtainType {
  STRAIGHT_TRACK = 'STRAIGHT_TRACK',
  L_TRACK = 'L_TRACK',
  EMBEDDED_TRACK = 'EMBEDDED_TRACK',
  EMBEDDED_L_TRACK = 'EMBEDDED_L_TRACK',
  DREAM_TRACK = 'DREAM_TRACK',
  ROLLER_BLIND = 'ROLLER_BLIND',
  ARC_TRACK = 'ARC_TRACK',
  U_TRACK = 'U_TRACK',
  LIFT_BLIND = 'LIFT_BLIND',
}

export enum LayerType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
}

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

export class CurtainRoomDetailDto {
  @ApiProperty({ description: '房间名称' })
  @IsString()
  @IsNotEmpty()
  roomName!: string;

  @ApiProperty({ description: '窗帘类型', enum: CurtainType })
  @IsEnum(CurtainType)
  curtainType!: CurtainType;

  @ApiPropertyOptional({ description: '是否有窗帘盒' })
  @IsOptional()
  @IsBoolean()
  hasCurtainBox?: boolean;

  @ApiPropertyOptional({ description: '窗帘盒宽度(米)' })
  @IsOptional()
  @IsNumber()
  curtainBoxWidth?: number;

  @ApiPropertyOptional({ description: '窗帘盒材质' })
  @IsOptional()
  @IsString()
  curtainBoxMaterial?: string;

  @ApiPropertyOptional({ description: '左侧长度(米)' })
  @IsOptional()
  @IsNumber()
  leftLength?: number;

  @ApiPropertyOptional({ description: '右侧长度(米)' })
  @IsOptional()
  @IsNumber()
  rightLength?: number;

  @ApiPropertyOptional({ description: '中间长度(米)' })
  @IsOptional()
  @IsNumber()
  middleLength?: number;

  @ApiPropertyOptional({ description: 'L型方向' })
  @IsOptional()
  @IsString()
  lDirection?: string;

  @ApiPropertyOptional({ description: '安装类型' })
  @IsOptional()
  @IsString()
  installType?: string;

  @ApiPropertyOptional({ description: '是否有罩壳' })
  @IsOptional()
  @IsBoolean()
  hasShell?: boolean;

  @ApiProperty({ description: '单双层', enum: LayerType })
  @IsEnum(LayerType)
  layerType!: LayerType;

  @ApiPropertyOptional({ description: '安装位置' })
  @IsOptional()
  @IsString()
  installPosition?: string;

  @ApiPropertyOptional({ description: '电源位置' })
  @IsOptional()
  @IsString()
  powerPosition?: string;

  @ApiPropertyOptional({ description: '电机商品ID' })
  @IsOptional()
  @IsString()
  motorProductId?: string;

  @ApiPropertyOptional({ description: '是否带布匹销售' })
  @IsOptional()
  @IsBoolean()
  withFabric?: boolean;

  @ApiPropertyOptional({ description: '布匹高度(米)' })
  @IsOptional()
  @IsNumber()
  fabricHeight?: number;

  @ApiPropertyOptional({ description: '布匹商品ID' })
  @IsOptional()
  @IsString()
  fabricProductId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '媒体 URL（图片/视频）', type: [String] })
  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
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

  @ApiPropertyOptional({ description: '房间窗帘详细信息列表（用于自动计算价格）', type: [CurtainRoomDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurtainRoomDetailDto)
  roomDetails?: CurtainRoomDetailDto[];

  @ApiPropertyOptional({ description: '是否自动生成销售出库单' })
  @IsOptional()
  @IsBoolean()
  autoGenerateOutbound?: boolean;

  @ApiPropertyOptional({ description: '操作员ID（用于自动生成出库单）', required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;
}

export class UpdateCurtainOrderDto {
  @ApiPropertyOptional({ description: '关联项目 ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '电动窗帘房间数量' })
  @IsOptional()
  @IsInt()
  @Min(1)
  roomCount?: number;

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

  @ApiPropertyOptional({ description: '房间窗帘信息列表', type: [CurtainRoomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurtainRoomDto)
  rooms?: CurtainRoomDto[];

  @ApiPropertyOptional({ description: '房间窗帘详细信息列表（用于自动计算价格）', type: [CurtainRoomDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurtainRoomDetailDto)
  roomDetails?: CurtainRoomDetailDto[];

  @ApiPropertyOptional({ description: '是否自动生成销售出库单' })
  @IsOptional()
  @IsBoolean()
  autoGenerateOutbound?: boolean;

  @ApiPropertyOptional({ description: '操作员ID（用于自动生成出库单）', required: false })
  @IsOptional()
  @IsString()
  operatorId?: string;
}

export class CalculateCurtainPriceDto {
  @ApiProperty({ description: '房间窗帘详细信息列表', type: [CurtainRoomDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurtainRoomDetailDto)
  rooms!: CurtainRoomDetailDto[];
}

export class RoomPriceDetailDto {
  @ApiProperty({ description: '房间名称' })
  roomName!: string;

  @ApiProperty({ description: '窗帘类型' })
  curtainType!: string;

  @ApiProperty({ description: '单双层' })
  layerType!: string;

  @ApiProperty({ description: '布匹价格' })
  fabricPrice!: number;

  @ApiProperty({ description: '轨道费用' })
  trackPrice!: number;

  @ApiProperty({ description: '下单根数费用' })
  rodPrice!: number;
}

export class CurtainPriceResultDto {
  @ApiProperty({ description: '布匹总价' })
  fabricPrice!: number;

  @ApiProperty({ description: '轨道总费用' })
  trackPrice!: number;

  @ApiProperty({ description: '下单根数总费用' })
  rodPrice!: number;

  @ApiProperty({ description: '总价' })
  totalPrice!: number;

  @ApiProperty({ description: '各房间明细', type: [RoomPriceDetailDto] })
  details!: RoomPriceDetailDto[];
}
