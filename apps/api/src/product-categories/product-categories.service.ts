import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.productCategory.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const row = await this.prisma.productCategory.findFirst({
      where: this.prisma.getTenantWhere({ id }),
    });
    if (!row) throw new NotFoundException('商品分类不存在');
    return row;
  }

  async create(dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: this.prisma.getTenantData({
        name: dto.name,
        recommendedInstallationFee: dto.recommendedInstallationFee,
        recommendedDebuggingFee: dto.recommendedDebuggingFee ?? undefined,
        recommendedOtherFee: dto.recommendedOtherFee ?? undefined,
        remark: dto.remark ?? undefined,
      }),
    });
  }

  async update(id: string, dto: UpdateProductCategoryDto) {
    await this.get(id);
    return this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.recommendedInstallationFee !== undefined
          ? { recommendedInstallationFee: dto.recommendedInstallationFee }
          : {}),
        ...(dto.recommendedDebuggingFee !== undefined
          ? { recommendedDebuggingFee: dto.recommendedDebuggingFee }
          : {}),
        ...(dto.recommendedOtherFee !== undefined
          ? { recommendedOtherFee: dto.recommendedOtherFee }
          : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.productCategory.delete({ where: { id } });
    return { success: true };
  }
}

