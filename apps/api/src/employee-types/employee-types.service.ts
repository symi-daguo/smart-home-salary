import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateEmployeeTypeDto, UpdateEmployeeTypeDto } from './dto/employee-type.dto';

@Injectable()
export class EmployeeTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.employeeType.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.employeeType.findFirst({
      where: this.prisma.getTenantWhere({ id }),
    });
    if (!row) throw new NotFoundException('员工类型不存在');
    return row;
  }

  async create(dto: CreateEmployeeTypeDto) {
    return this.prisma.employeeType.create({
      data: this.prisma.getTenantData({
        key: dto.key,
        name: dto.name,
        skillTags: dto.skillTags ?? undefined,
      }),
    });
  }

  async update(id: string, dto: UpdateEmployeeTypeDto) {
    await this.get(id);
    return this.prisma.employeeType.update({
      where: { id },
      data: {
        ...(dto.key !== undefined ? { key: dto.key } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.skillTags !== undefined
          ? {
              skillTags: dto.skillTags === null ? Prisma.JsonNull : dto.skillTags,
            }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.employeeType.delete({ where: { id } });
    return { success: true };
  }
}

