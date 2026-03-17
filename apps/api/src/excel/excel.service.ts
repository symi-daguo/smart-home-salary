import { BadRequestException, Injectable } from '@nestjs/common';
import { EmploymentStatus, Prisma, ProjectStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../common/prisma.service';

type SheetRow = Record<string, any>;

function toStringSafe(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function toNumberSafe(v: any): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeBool(v: any): boolean {
  const s = toStringSafe(v).toLowerCase();
  if (!s) return false;
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === '是';
}

function parseDateString(v: any): string {
  // 允许 YYYY-MM-DD / Date / Excel serial；最终返回 YYYY-MM-DD
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = toStringSafe(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // try Excel date serial
  const n = Number(s);
  if (Number.isFinite(n) && n > 20000 && n < 60000) {
    const d = XLSX.SSF.parse_date_code(n);
    if (d) {
      const y = d.y;
      const m = String(d.m).padStart(2, '0');
      const dd = String(d.d).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  }
  throw new BadRequestException(`日期格式错误：${s}，需要 YYYY-MM-DD`);
}

function workbookFromBuffer(buf: Buffer) {
  return XLSX.read(buf, { type: 'buffer' });
}

function sheetToRows(wb: XLSX.WorkBook, sheetName?: string): SheetRow[] {
  const name = sheetName || wb.SheetNames[0];
  const ws = wb.Sheets[name];
  if (!ws) throw new BadRequestException('Excel 无有效工作表');
  const rows = XLSX.utils.sheet_to_json<SheetRow>(ws, { defval: '' });
  if (!rows.length) throw new BadRequestException('Excel 内容为空');
  return rows;
}

function makeXlsxBuffer(sheets: Record<string, any[]>) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return out;
}

function makeTemplateXlsxBuffer(sheetName: string, headerKeys: string[]) {
  const sampleRow: Record<string, any> = {};
  for (const k of headerKeys) sampleRow[k] = '';
  return makeXlsxBuffer({ [sheetName]: [sampleRow] });
}

@Injectable()
export class ExcelService {
  constructor(private readonly prisma: PrismaService) {}

  async exportEmployees() {
    const rows = await this.prisma.employee.findMany({
      where: this.prisma.getTenantWhere(),
      include: { position: true },
      orderBy: { createdAt: 'asc' },
    });
    const data = rows.map((e) => ({
      name: e.name,
      phone: e.phone,
      positionName: e.position?.name ?? '',
      entryDate: e.entryDate.toISOString().slice(0, 10),
      status: e.status,
    }));
    return makeXlsxBuffer({ employees: data });
  }

  async exportEmployeesJson() {
    const rows = await this.prisma.employee.findMany({
      where: this.prisma.getTenantWhere(),
      include: { position: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((e) => ({
      name: e.name,
      phone: e.phone,
      positionName: e.position?.name ?? '',
      entryDate: e.entryDate.toISOString().slice(0, 10),
      status: e.status,
    }));
  }

  employeesTemplateXlsx() {
    return makeTemplateXlsxBuffer('employees', ['name', 'phone', 'positionName', 'entryDate', 'status']);
  }

  employeesTemplateJson() {
    return [
      { name: '张三', phone: '13800000000', positionName: '销售岗', entryDate: '2026-03-01', status: 'ACTIVE' },
    ];
  }

  async importEmployees(buf: Buffer) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    const wb = workbookFromBuffer(buf);
    const rows = sheetToRows(wb, 'employees');
    let upserted = 0;

    // positions cache
    const existingPositions = await this.prisma.position.findMany({
      where: this.prisma.getTenantWhere(),
      select: { id: true, name: true, baseSalary: true, commissionRule: true },
    });
    const posByName = new Map(existingPositions.map((p) => [p.name, p.id]));

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['姓名']);
      const phone = toStringSafe(r.phone ?? r['手机号']);
      const positionName = toStringSafe(r.positionName ?? r['岗位']);
      const entryDate = parseDateString(r.entryDate ?? r['入职日期']);
      const statusRaw = toStringSafe(r.status ?? r['状态']) || 'ACTIVE';
      const status =
        statusRaw === 'INACTIVE' || statusRaw === '离职' ? EmploymentStatus.INACTIVE : EmploymentStatus.ACTIVE;

      if (!name || !phone || !positionName) {
        throw new BadRequestException('employees 表必须包含 name/phone/positionName（或 姓名/手机号/岗位）');
      }

      let positionId = posByName.get(positionName);
      if (!positionId) {
        // MVP：自动创建缺失岗位（底薪=0，提成规则空），避免导入被阻断
        const created = await this.prisma.position.create({
          data: this.prisma.getTenantData({
            name: positionName,
            baseSalary: 0,
            commissionRule: {},
            phoneAllowance: 0,
            transportAllowance: 0,
            otherAllowance: 0,
          }),
        });
        positionId = created.id;
        posByName.set(positionName, positionId);
      }

      await this.prisma.employee.upsert({
        where: { tenantId_phone: { tenantId, phone } },
        create: this.prisma.getTenantData({
          name,
          phone,
          positionId,
          entryDate: new Date(entryDate),
          status,
        }),
        update: { name, positionId, entryDate: new Date(entryDate), status },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async importEmployeesJson(rows: SheetRow[]) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    if (!Array.isArray(rows) || !rows.length) throw new BadRequestException('JSON 内容为空，需为数组');
    let upserted = 0;

    const existingPositions = await this.prisma.position.findMany({
      where: this.prisma.getTenantWhere(),
      select: { id: true, name: true },
    });
    const posByName = new Map(existingPositions.map((p) => [p.name, p.id]));

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['姓名']);
      const phone = toStringSafe(r.phone ?? r['手机号']);
      const positionName = toStringSafe(r.positionName ?? r['岗位']);
      const entryDate = parseDateString(r.entryDate ?? r['入职日期']);
      const statusRaw = toStringSafe(r.status ?? r['状态']) || 'ACTIVE';
      const status =
        statusRaw === 'INACTIVE' || statusRaw === '离职' ? EmploymentStatus.INACTIVE : EmploymentStatus.ACTIVE;

      if (!name || !phone || !positionName) {
        throw new BadRequestException('employees JSON 必须包含 name/phone/positionName');
      }

      let positionId = posByName.get(positionName);
      if (!positionId) {
        const created = await this.prisma.position.create({
          data: this.prisma.getTenantData({
            name: positionName,
            baseSalary: 0,
            commissionRule: {},
            phoneAllowance: 0,
            transportAllowance: 0,
            otherAllowance: 0,
          }),
        });
        positionId = created.id;
        posByName.set(positionName, positionId);
      }

      await this.prisma.employee.upsert({
        where: { tenantId_phone: { tenantId, phone } },
        create: this.prisma.getTenantData({
          name,
          phone,
          positionId,
          entryDate: new Date(entryDate),
          status,
        }),
        update: { name, positionId, entryDate: new Date(entryDate), status },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async exportProducts() {
    const rows = await this.prisma.product.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { createdAt: 'asc' },
    });
    const data = rows.map((p) => ({
      name: p.name,
      category: p.category,
      standardPrice: p.standardPrice.toString(),
      installationFee: p.installationFee.toString(),
      debuggingFee: p.debuggingFee?.toString() ?? '',
      otherFee: p.otherFee?.toString() ?? '',
      maintenanceDeposit: p.maintenanceDeposit?.toString() ?? '',
      isSpecialInstallation: p.isSpecialInstallation ? 1 : 0,
    }));
    return makeXlsxBuffer({ products: data });
  }

  async exportProductsJson() {
    const rows = await this.prisma.product.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((p) => ({
      name: p.name,
      category: p.category,
      standardPrice: Number(p.standardPrice),
      installationFee: Number(p.installationFee),
      debuggingFee: p.debuggingFee === null ? null : p.debuggingFee ? Number(p.debuggingFee) : null,
      otherFee: p.otherFee === null ? null : p.otherFee ? Number(p.otherFee) : null,
      maintenanceDeposit: p.maintenanceDeposit === null ? null : p.maintenanceDeposit ? Number(p.maintenanceDeposit) : null,
      isSpecialInstallation: p.isSpecialInstallation,
    }));
  }

  productsTemplateXlsx() {
    return makeTemplateXlsxBuffer('products', [
      'name',
      'category',
      'standardPrice',
      'installationFee',
      'debuggingFee',
      'otherFee',
      'maintenanceDeposit',
      'isSpecialInstallation',
    ]);
  }

  productsTemplateJson() {
    return [
      {
        name: '智能开关',
        category: '开关类',
        standardPrice: 199,
        installationFee: 60,
        debuggingFee: 30,
        otherFee: 20,
        maintenanceDeposit: 0,
        isSpecialInstallation: false,
      },
    ];
  }

  async importProducts(buf: Buffer) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    const wb = workbookFromBuffer(buf);
    const rows = sheetToRows(wb, 'products');
    let upserted = 0;

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['商品名称']);
      const category = toStringSafe(r.category ?? r['分类']);
      const standardPrice = toNumberSafe(r.standardPrice ?? r['标准价']);
      const installationFee = toNumberSafe(r.installationFee ?? r['安装费']);
      const debuggingFee = toNumberSafe(r.debuggingFee ?? r['调试费']);
      const otherFee = toNumberSafe(r.otherFee ?? r['售后费']);
      const maintenanceDeposit = toNumberSafe(r.maintenanceDeposit ?? r['维护押金']);
      const isSpecialInstallation = normalizeBool(r.isSpecialInstallation ?? r['特殊安装']);

      if (!name || !category || standardPrice === undefined || installationFee === undefined) {
        throw new BadRequestException(
          'products 表必须包含 name/category/standardPrice/installationFee（或 商品名称/分类/标准价/安装费）',
        );
      }

      await this.prisma.product.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name,
          },
        },
        create: this.prisma.getTenantData({
          name,
          category,
          standardPrice,
          installationFee,
          debuggingFee: debuggingFee ?? null,
          otherFee: otherFee ?? null,
          maintenanceDeposit: maintenanceDeposit ?? null,
          isSpecialInstallation,
        }),
        update: {
          category,
          standardPrice,
          installationFee,
          debuggingFee: debuggingFee ?? null,
          otherFee: otherFee ?? null,
          maintenanceDeposit: maintenanceDeposit ?? null,
          isSpecialInstallation,
        },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async importProductsJson(rows: SheetRow[]) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    if (!Array.isArray(rows) || !rows.length) throw new BadRequestException('JSON 内容为空，需为数组');
    let upserted = 0;

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['商品名称']);
      const category = toStringSafe(r.category ?? r['分类']);
      const standardPrice = toNumberSafe(r.standardPrice ?? r['标准价']);
      const installationFee = toNumberSafe(r.installationFee ?? r['安装费']);
      const debuggingFee = toNumberSafe(r.debuggingFee ?? r['调试费']);
      const otherFee = toNumberSafe(r.otherFee ?? r['售后费']);
      const maintenanceDeposit = toNumberSafe(r.maintenanceDeposit ?? r['维护押金']);
      const isSpecialInstallation = normalizeBool(r.isSpecialInstallation ?? r['特殊安装']);

      if (!name || !category || standardPrice === undefined || installationFee === undefined) {
        throw new BadRequestException('products JSON 必须包含 name/category/standardPrice/installationFee');
      }

      await this.prisma.product.upsert({
        where: { tenantId_name: { tenantId, name } },
        create: this.prisma.getTenantData({
          name,
          category,
          standardPrice,
          installationFee,
          debuggingFee: debuggingFee ?? null,
          otherFee: otherFee ?? null,
          maintenanceDeposit: maintenanceDeposit ?? null,
          isSpecialInstallation,
        }),
        update: {
          category,
          standardPrice,
          installationFee,
          debuggingFee: debuggingFee ?? null,
          otherFee: otherFee ?? null,
          maintenanceDeposit: maintenanceDeposit ?? null,
          isSpecialInstallation,
        },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async exportProjects() {
    const rows = await this.prisma.project.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { createdAt: 'asc' },
    });
    const data = rows.map((p) => ({
      name: p.name,
      address: p.address,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      contractAmount: p.contractAmount.toString(),
      signDate: p.signDate.toISOString().slice(0, 10),
      status: p.status,
    }));
    return makeXlsxBuffer({ projects: data });
  }

  async exportProjectsJson() {
    const rows = await this.prisma.project.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((p) => ({
      name: p.name,
      address: p.address,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      contractAmount: Number(p.contractAmount),
      signDate: p.signDate.toISOString().slice(0, 10),
      status: p.status,
    }));
  }

  projectsTemplateXlsx() {
    return makeTemplateXlsxBuffer('projects', [
      'name',
      'address',
      'customerName',
      'customerPhone',
      'contractAmount',
      'signDate',
      'status',
    ]);
  }

  projectsTemplateJson() {
    return [
      {
        name: '万科一期',
        address: '深圳南山',
        customerName: '张三',
        customerPhone: '13800000001',
        contractAmount: 50000,
        signDate: '2026-03-01',
        status: 'IN_PROGRESS',
      },
    ];
  }

  async importProjects(buf: Buffer) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    const wb = workbookFromBuffer(buf);
    const rows = sheetToRows(wb, 'projects');
    let upserted = 0;

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['项目名称']);
      const address = toStringSafe(r.address ?? r['地址']);
      const customerName = toStringSafe(r.customerName ?? r['客户姓名']);
      const customerPhone = toStringSafe(r.customerPhone ?? r['客户电话']);
      const contractAmount = toNumberSafe(r.contractAmount ?? r['合同金额']);
      const signDate = parseDateString(r.signDate ?? r['签订日期']);
      const statusRaw = toStringSafe(r.status ?? r['状态']) || 'IN_PROGRESS';
      const status =
        statusRaw === 'DONE' || statusRaw === '已完成'
          ? ProjectStatus.DONE
          : statusRaw === 'ARCHIVED' || statusRaw === '已归档'
            ? ProjectStatus.ARCHIVED
            : ProjectStatus.IN_PROGRESS;

      if (!name || !address || !customerName || !customerPhone || contractAmount === undefined) {
        throw new BadRequestException(
          'projects 表必须包含 name/address/customerName/customerPhone/contractAmount/signDate',
        );
      }

      await this.prisma.project.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name,
          },
        },
        create: this.prisma.getTenantData({
          name,
          address,
          customerName,
          customerPhone,
          contractAmount,
          signDate: new Date(signDate),
          status,
        }),
        update: {
          address,
          customerName,
          customerPhone,
          contractAmount,
          signDate: new Date(signDate),
          status,
        },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async importProjectsJson(rows: SheetRow[]) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    if (!Array.isArray(rows) || !rows.length) throw new BadRequestException('JSON 内容为空，需为数组');
    let upserted = 0;

    for (const r of rows) {
      const name = toStringSafe(r.name ?? r['项目名称']);
      const address = toStringSafe(r.address ?? r['地址']);
      const customerName = toStringSafe(r.customerName ?? r['客户姓名']);
      const customerPhone = toStringSafe(r.customerPhone ?? r['客户电话']);
      const contractAmount = toNumberSafe(r.contractAmount ?? r['合同金额']);
      const signDate = parseDateString(r.signDate ?? r['签订日期']);
      const statusRaw = toStringSafe(r.status ?? r['状态']) || 'IN_PROGRESS';
      const status =
        statusRaw === 'DONE' || statusRaw === '已完成'
          ? ProjectStatus.DONE
          : statusRaw === 'ARCHIVED' || statusRaw === '已归档'
            ? ProjectStatus.ARCHIVED
            : ProjectStatus.IN_PROGRESS;

      if (!name || !address || !customerName || !customerPhone || contractAmount === undefined) {
        throw new BadRequestException('projects JSON 必须包含 name/address/customerName/customerPhone/contractAmount/signDate');
      }

      await this.prisma.project.upsert({
        where: { tenantId_name: { tenantId, name } },
        create: this.prisma.getTenantData({
          name,
          address,
          customerName,
          customerPhone,
          contractAmount,
          signDate: new Date(signDate),
          status,
        }),
        update: { address, customerName, customerPhone, contractAmount, signDate: new Date(signDate), status },
      });
      upserted += 1;
    }

    return { upserted };
  }

  async exportSalesOrders() {
    const rows = await this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { occurredAt: 'asc' },
      include: {
        project: true,
        employee: true,
      },
    });
    const data = rows.map((o) => ({
      projectName: o.project?.name ?? '',
      employeePhone: o.employee?.phone ?? '',
      amount: o.amount.toString(),
      discountRate: o.discountRate.toString(),
      occurredAt: o.occurredAt.toISOString(),
      verified: o.verified ? 1 : 0,
      remark: o.remark ?? '',
    }));
    return makeXlsxBuffer({ salesOrders: data });
  }

  async exportSalesOrdersJson() {
    const rows = await this.prisma.salesOrder.findMany({
      where: this.prisma.getTenantWhere(),
      orderBy: { occurredAt: 'asc' },
      include: { project: true, employee: true },
    });
    return rows.map((o) => ({
      projectName: o.project?.name ?? '',
      employeePhone: o.employee?.phone ?? '',
      amount: Number(o.amount),
      discountRate: Number(o.discountRate),
      occurredAt: o.occurredAt.toISOString(),
      verified: o.verified,
      remark: o.remark ?? '',
    }));
  }

  salesOrdersTemplateXlsx() {
    return makeTemplateXlsxBuffer('salesOrders', [
      'projectName',
      'employeePhone',
      'amount',
      'discountRate',
      'occurredAt',
      'verified',
      'remark',
    ]);
  }

  salesOrdersTemplateJson() {
    return [
      {
        projectName: '万科一期',
        employeePhone: '13800000000',
        amount: 50000,
        discountRate: 0.95,
        occurredAt: '2026-03-12T00:00:00.000Z',
        verified: false,
        remark: '示例：销售订单导入',
      },
    ];
  }

  async importSalesOrders(buf: Buffer) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    const wb = workbookFromBuffer(buf);
    const rows = sheetToRows(wb, 'salesOrders');
    let created = 0;

    const projects = await this.prisma.project.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const employees = await this.prisma.employee.findMany({
      where: { tenantId },
      select: { id: true, phone: true },
    });
    const projByName = new Map(projects.map((p) => [p.name, p.id]));
    const empByPhone = new Map(employees.map((e) => [e.phone, e.id]));

    for (const r of rows) {
      const projectName = toStringSafe(r.projectName ?? r['项目']);
      const employeePhone = toStringSafe(r.employeePhone ?? r['员工手机号']);
      const amount = toNumberSafe(r.amount ?? r['金额']);
      const discountRate = toNumberSafe(r.discountRate ?? r['折扣率']);
      const occurredAtStr = toStringSafe(r.occurredAt ?? r['发生时间']);
      const verified = normalizeBool(r.verified ?? r['到账核验']);
      const remark = toStringSafe(r.remark ?? r['备注']);

      if (!projectName || !employeePhone || amount === undefined || discountRate === undefined) {
        throw new BadRequestException('salesOrders 表必须包含 projectName/employeePhone/amount/discountRate');
      }

      const projectId = projByName.get(projectName);
      if (!projectId) {
        throw new BadRequestException(`项目不存在：${projectName}`);
      }

      const employeeId = empByPhone.get(employeePhone);
      if (!employeeId) {
        throw new BadRequestException(`员工手机号不存在：${employeePhone}`);
      }

      const occurredAt = occurredAtStr ? new Date(occurredAtStr) : new Date();

      await this.prisma.salesOrder.create({
        data: this.prisma.getTenantData({
          projectId,
          employeeId,
          amount,
          discountRate,
          occurredAt,
          verified,
          remark: remark || undefined,
        }),
      });
      created += 1;
    }

    return { created };
  }

  async importSalesOrdersJson(rows: SheetRow[]) {
    const tenantId = this.prisma.getTenantWhere().tenantId;
    if (!Array.isArray(rows) || !rows.length) throw new BadRequestException('JSON 内容为空，需为数组');
    let created = 0;

    const projects = await this.prisma.project.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const employees = await this.prisma.employee.findMany({
      where: { tenantId },
      select: { id: true, phone: true },
    });
    const projByName = new Map(projects.map((p) => [p.name, p.id]));
    const empByPhone = new Map(employees.map((e) => [e.phone, e.id]));

    for (const r of rows) {
      const projectName = toStringSafe(r.projectName ?? r['项目']);
      const employeePhone = toStringSafe(r.employeePhone ?? r['员工手机号']);
      const amount = toNumberSafe(r.amount ?? r['金额']);
      const discountRate = toNumberSafe(r.discountRate ?? r['折扣率']);
      const occurredAtStr = toStringSafe(r.occurredAt ?? r['发生时间']);
      const verified = normalizeBool(r.verified ?? r['到账核验']);
      const remark = toStringSafe(r.remark ?? r['备注']);

      if (!projectName || !employeePhone || amount === undefined || discountRate === undefined) {
        throw new BadRequestException('salesOrders JSON 必须包含 projectName/employeePhone/amount/discountRate');
      }

      const projectId = projByName.get(projectName);
      if (!projectId) throw new BadRequestException(`项目不存在：${projectName}`);

      const employeeId = empByPhone.get(employeePhone);
      if (!employeeId) throw new BadRequestException(`员工手机号不存在：${employeePhone}`);

      const occurredAt = occurredAtStr ? new Date(occurredAtStr) : new Date();

      await this.prisma.salesOrder.create({
        data: this.prisma.getTenantData({
          projectId,
          employeeId,
          amount,
          discountRate,
          occurredAt,
          verified,
          remark: remark || undefined,
        }),
      });
      created += 1;
    }

    return { created };
  }

  async exportSalaries(params?: { yearMonth?: string; employeeId?: string; status?: any }) {
    const rows = await this.prisma.salary.findMany({
      where: this.prisma.getTenantWhere({
        ...(params?.yearMonth ? { yearMonth: params.yearMonth } : {}),
        ...(params?.employeeId ? { employeeId: params.employeeId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      }),
      include: { employee: { include: { position: true } } },
      orderBy: [{ yearMonth: 'desc' }, { createdAt: 'desc' }],
    });
    const data = rows.map((s) => ({
      月份: s.yearMonth,
      员工姓名: s.employee?.name ?? '',
      岗位: s.employee?.position?.name ?? '',
      底薪: s.baseSalary.toString(),
      销售提成: s.salesCommission.toString(),
      技术费: s.technicalFee.toString(),
      补贴: s.allowances.toString(),
      扣款: s.penalty.toString(),
      总额: s.total.toString(),
      状态: s.status === 'PAID' ? '已发放' : s.status === 'APPROVED' ? '已审批' : '草稿',
      发放日期: s.paidDate ? s.paidDate.toISOString().slice(0, 10) : '',
    }));
    return makeXlsxBuffer({ salaries: data });
  }
}

