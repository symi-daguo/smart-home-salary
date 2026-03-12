import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [RbacModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}

