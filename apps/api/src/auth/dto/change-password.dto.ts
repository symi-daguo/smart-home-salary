import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ description: '新密码，至少 8 位' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

