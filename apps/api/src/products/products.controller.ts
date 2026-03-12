import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';
import { SearchQueryDto } from '../common/dto/search.dto';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermissions('products.manage', 'products.read')
  @ApiOperation({ summary: '商品列表' })
  @ApiResponse({ status: 200 })
  async list(@Query() query: SearchQueryDto) {
    return this.products.list({ q: query.q, limit: query.limit });
  }

  @Get(':id')
  @RequirePermissions('products.manage', 'products.read')
  @ApiOperation({ summary: '获取商品详情' })
  async get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Post()
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '创建商品' })
  async create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Put(':id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '更新商品' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '删除商品' })
  async remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}

