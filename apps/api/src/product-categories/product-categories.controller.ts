import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('Product Categories')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('product-categories')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProductCategoriesController {
  constructor(private readonly categories: ProductCategoriesService) {}

  @Get()
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '商品分类列表' })
  @ApiResponse({ status: 200 })
  async list() {
    return this.categories.list();
  }

  @Get(':id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '获取商品分类详情' })
  async get(@Param('id') id: string) {
    return this.categories.get(id);
  }

  @Post()
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '创建商品分类（含推荐费用）' })
  async create(@Body() dto: CreateProductCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '更新商品分类' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '删除商品分类' })
  async remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}

