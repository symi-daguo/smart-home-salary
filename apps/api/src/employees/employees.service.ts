import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.employee.findMany({
      where: this.prisma.getTenantWhere(),
      include: { position: true, employeeType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.employee.findFirst({
      where: this.prisma.getTenantWhere({ id }),
      include: { position: true, employeeType: true },
    });
    if (!row) throw new NotFoundException('员工不存在');
    return row;
  }

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({
      data: this.prisma.getTenantData({
        name: dto.name,
        phone: dto.phone,
        positionId: dto.positionId,
        employeeTypeId: dto.employeeTypeId ?? undefined,
        entryDate: new Date(dto.entryDate),
        status: dto.status ?? undefined,
        membershipId: dto.membershipId ?? undefined,
      }),
      include: { position: true, employeeType: true },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.get(id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.positionId !== undefined ? { positionId: dto.positionId } : {}),
        ...(dto.employeeTypeId !== undefined ? { employeeTypeId: dto.employeeTypeId } : {}),
        ...(dto.entryDate !== undefined ? { entryDate: new Date(dto.entryDate) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.membershipId !== undefined ? { membershipId: dto.membershipId } : {}),
      },
      include: { position: true, employeeType: true },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.employee.delete({ where: { id } });
    return { success: true };
  }
}

