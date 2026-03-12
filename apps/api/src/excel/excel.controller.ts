import { BadRequestException, Body, Controller, Get, Post, Res, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { ExcelService } from './excel.service';

@ApiTags('Excel')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-Tenant-ID')
@Controller('excel')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ExcelController {
  constructor(private readonly excel: ExcelService) {}

  private sendXlsx(res: Response, filename: string, buf: Buffer) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buf);
  }

  private getFileBuffer(file?: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('请上传 Excel 文件');
    return file.buffer;
  }

  @Get('employees/export')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '导出员工 Excel' })
  async exportEmployees(@Res() res: Response) {
    const buf = await this.excel.exportEmployees();
    return this.sendXlsx(res, 'employees.xlsx', buf);
  }

  @Get('employees/template')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '下载员工 Excel 模板' })
  async employeesTemplate(@Res() res: Response) {
    const buf = this.excel.employeesTemplateXlsx();
    return this.sendXlsx(res, 'employees.template.xlsx', buf);
  }

  @Get('employees/export-json')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '导出员工 JSON' })
  async exportEmployeesJson() {
    return this.excel.exportEmployeesJson();
  }

  @Get('employees/template-json')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '下载员工 JSON 模板' })
  async employeesTemplateJson() {
    return this.excel.employeesTemplateJson();
  }

  @Post('employees/import')
  @RequirePermissions('employees.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '导入员工 Excel（sheet=employees，按手机号 upsert）' })
  @ApiResponse({ status: 201 })
  async importEmployees(@UploadedFile() file: Express.Multer.File) {
    return this.excel.importEmployees(this.getFileBuffer(file));
  }

  @Post('employees/import-json')
  @RequirePermissions('employees.manage')
  @ApiOperation({ summary: '导入员工 JSON（按手机号 upsert）' })
  @ApiResponse({ status: 201 })
  async importEmployeesJson(@Body() rows: any[]) {
    return this.excel.importEmployeesJson(rows);
  }

  @Get('products/export')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '导出商品 Excel' })
  async exportProducts(@Res() res: Response) {
    const buf = await this.excel.exportProducts();
    return this.sendXlsx(res, 'products.xlsx', buf);
  }

  @Get('products/template')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '下载商品 Excel 模板' })
  async productsTemplate(@Res() res: Response) {
    const buf = this.excel.productsTemplateXlsx();
    return this.sendXlsx(res, 'products.template.xlsx', buf);
  }

  @Get('products/export-json')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '导出商品 JSON' })
  async exportProductsJson() {
    return this.excel.exportProductsJson();
  }

  @Get('products/template-json')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '下载商品 JSON 模板' })
  async productsTemplateJson() {
    return this.excel.productsTemplateJson();
  }

  @Post('products/import')
  @RequirePermissions('products.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '导入商品 Excel（sheet=products，按商品名称 upsert）' })
  @ApiResponse({ status: 201 })
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    return this.excel.importProducts(this.getFileBuffer(file));
  }

  @Post('products/import-json')
  @RequirePermissions('products.manage')
  @ApiOperation({ summary: '导入商品 JSON（按商品名称 upsert）' })
  @ApiResponse({ status: 201 })
  async importProductsJson(@Body() rows: any[]) {
    return this.excel.importProductsJson(rows);
  }

  @Get('projects/export')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '导出项目 Excel' })
  async exportProjects(@Res() res: Response) {
    const buf = await this.excel.exportProjects();
    return this.sendXlsx(res, 'projects.xlsx', buf);
  }

  @Get('projects/template')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '下载项目 Excel 模板' })
  async projectsTemplate(@Res() res: Response) {
    const buf = this.excel.projectsTemplateXlsx();
    return this.sendXlsx(res, 'projects.template.xlsx', buf);
  }

  @Get('projects/export-json')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '导出项目 JSON' })
  async exportProjectsJson() {
    return this.excel.exportProjectsJson();
  }

  @Get('projects/template-json')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '下载项目 JSON 模板' })
  async projectsTemplateJson() {
    return this.excel.projectsTemplateJson();
  }

  @Post('projects/import')
  @RequirePermissions('projects.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '导入项目 Excel（sheet=projects，按项目名称 upsert）' })
  @ApiResponse({ status: 201 })
  async importProjects(@UploadedFile() file: Express.Multer.File) {
    return this.excel.importProjects(this.getFileBuffer(file));
  }

  @Post('projects/import-json')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: '导入项目 JSON（按项目名称 upsert）' })
  @ApiResponse({ status: 201 })
  async importProjectsJson(@Body() rows: any[]) {
    return this.excel.importProjectsJson(rows);
  }

  @Get('sales-orders/export')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '导出销售订单 Excel' })
  async exportSalesOrders(@Res() res: Response) {
    const buf = await this.excel.exportSalesOrders();
    return this.sendXlsx(res, 'sales-orders.xlsx', buf);
  }

  @Get('sales-orders/template')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '下载销售订单 Excel 模板' })
  async salesOrdersTemplate(@Res() res: Response) {
    const buf = this.excel.salesOrdersTemplateXlsx();
    return this.sendXlsx(res, 'sales-orders.template.xlsx', buf);
  }

  @Get('sales-orders/export-json')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '导出销售订单 JSON' })
  async exportSalesOrdersJson() {
    return this.excel.exportSalesOrdersJson();
  }

  @Get('sales-orders/template-json')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '下载销售订单 JSON 模板' })
  async salesOrdersTemplateJson() {
    return this.excel.salesOrdersTemplateJson();
  }

  @Post('sales-orders/import')
  @RequirePermissions('entries.manage')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '导入销售订单 Excel（sheet=salesOrders，按项目名+员工手机号创建订单）',
  })
  @ApiResponse({ status: 201 })
  async importSalesOrders(@UploadedFile() file: Express.Multer.File) {
    return this.excel.importSalesOrders(this.getFileBuffer(file));
  }

  @Post('sales-orders/import-json')
  @RequirePermissions('entries.manage')
  @ApiOperation({ summary: '导入销售订单 JSON（按项目名+员工手机号创建订单）' })
  @ApiResponse({ status: 201 })
  async importSalesOrdersJson(@Body() rows: any[]) {
    return this.excel.importSalesOrdersJson(rows);
  }
}

