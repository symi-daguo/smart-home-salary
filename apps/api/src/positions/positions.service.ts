import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.position.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.position.findFirst({
      where: this.prisma.getTenantWhere({ id }),
    });
    if (!row) throw new NotFoundException('岗位不存在');
    return row;
  }

  async create(dto: CreatePositionDto) {
    return this.prisma.position.create({
      data: this.prisma.getTenantData({
        name: dto.name,
        baseSalary: dto.baseSalary,
        commissionRule: dto.commissionRule,
        bonusRule: dto.bonusRule ?? undefined,
        phoneAllowance: dto.phoneAllowance ?? 0,
        transportAllowance: dto.transportAllowance ?? 0,
        otherAllowance: dto.otherAllowance ?? 0,
      }),
    });
  }

  async update(id: string, dto: UpdatePositionDto) {
    await this.get(id);
    return this.prisma.position.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.baseSalary !== undefined ? { baseSalary: dto.baseSalary } : {}),
        ...(dto.commissionRule !== undefined ? { commissionRule: dto.commissionRule } : {}),
        ...(dto.bonusRule !== undefined ? { bonusRule: dto.bonusRule } : {}),
        ...(dto.phoneAllowance !== undefined ? { phoneAllowance: dto.phoneAllowance } : {}),
        ...(dto.transportAllowance !== undefined ? { transportAllowance: dto.transportAllowance } : {}),
        ...(dto.otherAllowance !== undefined ? { otherAllowance: dto.otherAllowance } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.position.delete({ where: { id } });
    return { success: true };
  }
}

