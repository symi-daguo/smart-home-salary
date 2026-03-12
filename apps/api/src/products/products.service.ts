import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params?: { q?: string; limit?: number }) {
    const q = params?.q?.trim();
    const limit = params?.limit;
    return this.prisma.product.findMany({
      where: this.prisma.getTenantWhere(
        q
          ? {
              name: { contains: q, mode: 'insensitive' as const },
            }
          : undefined,
      ),
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }

  async get(id: string) {
    const row = await this.prisma.product.findFirst({
      where: this.prisma.getTenantWhere({ id }),
    });
    if (!row) throw new NotFoundException('商品不存在');
    return row;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: this.prisma.getTenantData({
        name: dto.name,
        category: dto.category,
        standardPrice: dto.standardPrice,
        installationFee: dto.installationFee,
        debuggingFee: dto.debuggingFee ?? undefined,
        otherFee: dto.otherFee ?? undefined,
        maintenanceDeposit: dto.maintenanceDeposit ?? undefined,
        isSpecialInstallation: dto.isSpecialInstallation ?? false,
      }),
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.get(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.standardPrice !== undefined ? { standardPrice: dto.standardPrice } : {}),
        ...(dto.installationFee !== undefined ? { installationFee: dto.installationFee } : {}),
        ...(dto.debuggingFee !== undefined ? { debuggingFee: dto.debuggingFee } : {}),
        ...(dto.otherFee !== undefined ? { otherFee: dto.otherFee } : {}),
        ...(dto.maintenanceDeposit !== undefined
          ? { maintenanceDeposit: dto.maintenanceDeposit }
          : {}),
        ...(dto.isSpecialInstallation !== undefined
          ? { isSpecialInstallation: dto.isSpecialInstallation }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}

