import 'dotenv/config';
import { PrismaClient, EmploymentStatus, SalaryStatus, AlertSeverity, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

const prisma = new PrismaClient();

function ym(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

async function upsertUser(email: string, displayName: string, passwordHash: string) {
  return prisma.user.upsert({
    where: { email },
    update: { displayName },
    create: {
      email,
      hashedPassword: passwordHash,
      isEmailVerified: true,
      displayName,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL. Please set env or run inside docker compose api container.');
  }
  const passwordHash = await bcrypt.hash('password', 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: { name: 'Acme Inc', slug: 'acme' },
  });

  // 1) 账号（每个“角色/类型”一个演示用户）
  const owner = await upsertUser('founder@yoursaas.com', 'Founder', passwordHash);
  const adminUser = await upsertUser('admin@demo.local', 'Admin Demo', passwordHash);
  const salesUser = await upsertUser('sales@demo.local', 'Sales Demo', passwordHash);
  const techUser = await upsertUser('technician@demo.local', 'Technician Demo', passwordHash);
  const financeUser = await upsertUser('finance@demo.local', 'Finance Demo', passwordHash);
  const guideUser = await upsertUser('guide@demo.local', 'Guide Demo', passwordHash);

  const ownerMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { role: Role.OWNER },
    create: { tenantId: tenant.id, userId: owner.id, role: Role.OWNER },
  });

  const adminMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: adminUser.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: adminUser.id, role: Role.ADMIN },
  });

  const salesMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: salesUser.id } },
    update: { role: Role.MEMBER },
    create: { tenantId: tenant.id, userId: salesUser.id, role: Role.MEMBER },
  });

  const techMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: techUser.id } },
    update: { role: Role.MEMBER },
    create: { tenantId: tenant.id, userId: techUser.id, role: Role.MEMBER },
  });

  const financeMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: financeUser.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: financeUser.id, role: Role.ADMIN },
  });

  const guideMembership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: guideUser.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: guideUser.id, role: Role.ADMIN },
  });

  // 2) 员工类型（补齐 member/admin/salary/guide，确保 Skill 路由稳定）
  await prisma.employeeType.createMany({
    skipDuplicates: true,
    data: [
      { tenantId: tenant.id, key: 'member', name: '员工', skillTags: ['member'] },
      { tenantId: tenant.id, key: 'admin', name: '管理员', skillTags: ['admin', 'guide'] },
      { tenantId: tenant.id, key: 'salary', name: '财务', skillTags: ['admin', 'salary'] },
      { tenantId: tenant.id, key: 'guide', name: '运营指导', skillTags: ['admin', 'guide'] },
      { tenantId: tenant.id, key: 'sales', name: '销售', skillTags: ['member', 'sales'] },
      { tenantId: tenant.id, key: 'technician', name: '安装工程师', skillTags: ['member', 'technician'] },
    ],
  });

  const [tSales, tTech, tSalary, tGuide, tAdmin] = await Promise.all([
    prisma.employeeType.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: 'sales' } } }),
    prisma.employeeType.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: 'technician' } } }),
    prisma.employeeType.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: 'salary' } } }),
    prisma.employeeType.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: 'guide' } } }),
    prisma.employeeType.findUnique({ where: { tenantId_key: { tenantId: tenant.id, key: 'admin' } } }),
  ]);

  // 3) 岗位（用于工资结算）
  await prisma.position.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        name: 'TEST-销售岗',
        baseSalary: 6000,
        commissionRule: {},
        phoneAllowance: 200,
        transportAllowance: 200,
        otherAllowance: 100,
      },
      {
        tenantId: tenant.id,
        name: 'TEST-技术岗',
        baseSalary: 7000,
        commissionRule: {},
        phoneAllowance: 200,
        transportAllowance: 300,
        otherAllowance: 100,
      },
      {
        tenantId: tenant.id,
        name: 'TEST-财务岗',
        baseSalary: 8000,
        commissionRule: {},
        phoneAllowance: 200,
        transportAllowance: 200,
        otherAllowance: 200,
      },
      {
        tenantId: tenant.id,
        name: 'TEST-管理岗',
        baseSalary: 9000,
        commissionRule: {},
        phoneAllowance: 300,
        transportAllowance: 300,
        otherAllowance: 300,
      },
    ],
  });

  const [pSales, pTech, pFinance, pAdmin] = await Promise.all([
    prisma.position.findUnique({ where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-销售岗' } } }),
    prisma.position.findUnique({ where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-技术岗' } } }),
    prisma.position.findUnique({ where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-财务岗' } } }),
    prisma.position.findUnique({ where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-管理岗' } } }),
  ]);

  if (!pSales || !pTech || !pFinance || !pAdmin || !tSales || !tTech || !tSalary || !tGuide || !tAdmin) {
    throw new Error('Seed dependencies missing (positions/employeeTypes)');
  }

  // 4) 员工档案（绑定 membershipId，保证 /my 与 my-profile 可用）
  const salesEmp = await prisma.employee.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '13800001001' } },
    update: { membershipId: salesMembership.id, employeeTypeId: tSales.id, positionId: pSales.id },
    create: {
      tenantId: tenant.id,
      name: 'TEST-销售员工',
      phone: '13800001001',
      entryDate: new Date('2026-03-01'),
      status: EmploymentStatus.ACTIVE,
      positionId: pSales.id,
      employeeTypeId: tSales.id,
      membershipId: salesMembership.id,
    },
  });

  const techEmp = await prisma.employee.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '13800001002' } },
    update: { membershipId: techMembership.id, employeeTypeId: tTech.id, positionId: pTech.id },
    create: {
      tenantId: tenant.id,
      name: 'TEST-技术员工',
      phone: '13800001002',
      entryDate: new Date('2026-03-01'),
      status: EmploymentStatus.ACTIVE,
      positionId: pTech.id,
      employeeTypeId: tTech.id,
      membershipId: techMembership.id,
    },
  });

  const financeEmp = await prisma.employee.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '13800001003' } },
    update: { membershipId: financeMembership.id, employeeTypeId: tSalary.id, positionId: pFinance.id },
    create: {
      tenantId: tenant.id,
      name: 'TEST-财务员工',
      phone: '13800001003',
      entryDate: new Date('2026-03-01'),
      status: EmploymentStatus.ACTIVE,
      positionId: pFinance.id,
      employeeTypeId: tSalary.id,
      membershipId: financeMembership.id,
    },
  });

  const guideEmp = await prisma.employee.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '13800001004' } },
    update: { membershipId: guideMembership.id, employeeTypeId: tGuide.id, positionId: pAdmin.id },
    create: {
      tenantId: tenant.id,
      name: 'TEST-运营指导',
      phone: '13800001004',
      entryDate: new Date('2026-03-01'),
      status: EmploymentStatus.ACTIVE,
      positionId: pAdmin.id,
      employeeTypeId: tGuide.id,
      membershipId: guideMembership.id,
    },
  });

  const adminEmp = await prisma.employee.upsert({
    where: { tenantId_phone: { tenantId: tenant.id, phone: '13800001005' } },
    update: { membershipId: adminMembership.id, employeeTypeId: tAdmin.id, positionId: pAdmin.id },
    create: {
      tenantId: tenant.id,
      name: 'TEST-管理员员工',
      phone: '13800001005',
      entryDate: new Date('2026-03-01'),
      status: EmploymentStatus.ACTIVE,
      positionId: pAdmin.id,
      employeeTypeId: tAdmin.id,
      membershipId: adminMembership.id,
    },
  });

  // 5) 商品 + 项目（保证销售/安装/测量/窗帘均可关联）
  const product = await prisma.product.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-智能开关' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'TEST-智能开关',
      category: '开关类',
      standardPrice: 199,
      installationFee: 60,
      debuggingFee: 30,
      otherFee: 20,
      maintenanceDeposit: 0,
      isSpecialInstallation: false,
      suggestedStockQty: 10,
      techCommissionInstall: 20,
      techCommissionDebug: 10,
      techCommissionMaintenance: 0,
      techCommissionAfterSales: 0,
    },
  });

  const project = await prisma.project.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'TEST-万科样板间' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'TEST-万科样板间',
      address: '深圳南山',
      customerName: '张三',
      customerPhone: '13800002000',
      contractAmount: 50000,
      signDate: new Date(),
    },
  });

  // 6) 销售上报（用于工作台营收/订单统计）
  const existingSales = await prisma.salesOrder.findFirst({
    where: { tenantId: tenant.id, remark: 'TESTDATA 销售上报', employeeId: salesEmp.id },
    include: { items: true },
  });
  const so =
    existingSales ??
    (await prisma.salesOrder.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        employeeId: salesEmp.id,
        amount: 50000,
        discountRate: 0.95,
        remark: 'TESTDATA 销售上报',
        occurredAt: new Date(),
        items: {
          create: [
            {
              tenantId: tenant.id,
              productId: product.id,
              quantity: 10,
              standardPrice: 199,
            },
          ],
        },
      },
      include: { items: true },
    }));

  // 为管理员/运营指导各注入一条“与其员工直接关联”的销售数据（便于按角色验收）
  const adminSales = await prisma.salesOrder.findFirst({
    where: { tenantId: tenant.id, remark: 'TESTDATA 管理员销售上报', employeeId: adminEmp.id },
  });
  if (!adminSales) {
    await prisma.salesOrder.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        employeeId: adminEmp.id,
        amount: 2000,
        discountRate: 1.0,
        remark: 'TESTDATA 管理员销售上报',
        occurredAt: new Date(),
      },
    });
  }

  const guideSales = await prisma.salesOrder.findFirst({
    where: { tenantId: tenant.id, remark: 'TESTDATA 运营指导销售上报', employeeId: guideEmp.id },
  });
  if (!guideSales) {
    await prisma.salesOrder.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        employeeId: guideEmp.id,
        amount: 3000,
        discountRate: 1.0,
        remark: 'TESTDATA 运营指导销售上报',
        occurredAt: new Date(),
      },
    });
  }

  // 7) 技术上报（安装记录）
  const techInstall = await prisma.installationRecord.findFirst({
    where: { tenantId: tenant.id, description: 'TESTDATA 安装记录', employeeId: techEmp.id },
  });
  if (!techInstall) {
    await prisma.installationRecord.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        employeeId: techEmp.id,
        productId: product.id,
        serviceType: ServiceType.INSTALL,
        quantity: 10,
        difficultyFactor: 1.2,
        description: 'TESTDATA 安装记录',
        occurredAt: new Date(),
        photoUrls: ['http://localhost:9000/salary-uploads/demo.jpg'],
      },
    });
  }

  // 8) 测量工勘 + 窗帘下单
  const survey = await prisma.measurementSurvey.findFirst({
    where: { tenantId: tenant.id, remark: 'TESTDATA 工勘信息记录' },
  });
  if (!survey) {
    await prisma.measurementSurvey.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        occurredAt: new Date(),
        remark: 'TESTDATA 工勘信息记录',
        mediaUrls: ['http://localhost:9000/salary-uploads/demo-survey.jpg'],
      },
    });
  }

  const curtainOrder = await prisma.curtainOrder.findFirst({
    where: { tenantId: tenant.id, remark: 'TESTDATA 窗帘下单' },
    select: { id: true },
  });
  if (!curtainOrder) {
    await prisma.curtainOrder.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        roomCount: 2,
        deliveryToDoor: true,
        receiverName: '李四',
        thirdPartyInstall: true,
        remark: 'TESTDATA 窗帘下单',
        rooms: {
          create: [
            {
              tenantId: tenant.id,
              roomName: '客厅',
              detail: { width: 2.0, height: 2.8, fabric: '涤纶', style: '双开' },
              mediaUrls: ['http://localhost:9000/salary-uploads/demo-curtain-1.jpg'],
            },
            {
              tenantId: tenant.id,
              roomName: '主卧',
              detail: { width: 1.8, height: 2.8, fabric: '棉麻', style: '单开' },
              mediaUrls: ['http://localhost:9000/salary-uploads/demo-curtain-2.jpg'],
            },
          ],
        },
      },
    });
  }

  // 9) 预警（用于工作台待处理预警数）
  const alert = await prisma.alert.findFirst({
    where: { tenantId: tenant.id, title: 'TESTDATA 销售与技术数量差异' },
    select: { id: true },
  });
  if (!alert) {
    await prisma.alert.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        severity: AlertSeverity.WARNING,
        title: 'TESTDATA 销售与技术数量差异',
        message: '用于演示预警列表与工作台统计',
        metadata: { salesOrderId: so.id },
        resolvedAt: null,
      },
    });
  }

  // 10) 工资单（用于工资结算页列表）
  const month = ym(new Date());
  await prisma.salary.upsert({
    where: { tenantId_employeeId_yearMonth: { tenantId: tenant.id, employeeId: salesEmp.id, yearMonth: month } },
    update: {},
    create: {
      tenantId: tenant.id,
      employeeId: salesEmp.id,
      yearMonth: month,
      baseSalary: 6000,
      salesCommission: 1000,
      tierCommission: 200,
      technicalFee: 0,
      allowances: 500,
      penalty: 0,
      total: 7700,
      status: SalaryStatus.DRAFT,
    },
  });

  await prisma.salary.upsert({
    where: { tenantId_employeeId_yearMonth: { tenantId: tenant.id, employeeId: techEmp.id, yearMonth: month } },
    update: {},
    create: {
      tenantId: tenant.id,
      employeeId: techEmp.id,
      yearMonth: month,
      baseSalary: 7000,
      salesCommission: 0,
      tierCommission: 0,
      technicalFee: 800,
      allowances: 600,
      penalty: 0,
      total: 8400,
      status: SalaryStatus.DRAFT,
    },
  });

  // 财务角色也注入一条与其员工直接关联的工资单（便于按角色验收）
  await prisma.salary.upsert({
    where: { tenantId_employeeId_yearMonth: { tenantId: tenant.id, employeeId: financeEmp.id, yearMonth: month } },
    update: {},
    create: {
      tenantId: tenant.id,
      employeeId: financeEmp.id,
      yearMonth: month,
      baseSalary: 8000,
      salesCommission: 0,
      tierCommission: 0,
      technicalFee: 0,
      allowances: 800,
      penalty: 0,
      total: 8800,
      status: SalaryStatus.DRAFT,
    },
  });

  console.info('Seed testdata complete:', {
    tenant: tenant.slug,
    users: {
      owner: owner.email,
      admin: adminUser.email,
      sales: salesUser.email,
      technician: techUser.email,
      finance: financeUser.email,
      guide: guideUser.email,
    },
    note: 'All demo users use password: password',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

