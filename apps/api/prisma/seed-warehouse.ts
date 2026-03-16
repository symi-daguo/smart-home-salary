import 'dotenv/config';
import { PrismaClient, WarehouseOrderType, OutboundApplicationType, OutboundApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL. Please set env or run inside docker compose api container.');
  }

  // 获取租户
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme' } });
  if (!tenant) {
    throw new Error('Tenant acme not found. Please run seed.ts first.');
  }

  // 获取用户
  const user = await prisma.user.findUnique({ where: { email: 'founder@yoursaas.com' } });
  if (!user) {
    throw new Error('User founder@yoursaas.com not found. Please run seed.ts first.');
  }

  // 获取员工（用于出库申请单的applicantId）
  const employee = await prisma.employee.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!employee) {
    throw new Error('No employee found for tenant. Please create an employee first.');
  }

  console.info('Seeding warehouse data for tenant:', tenant.slug);
  console.info('Using employee:', employee.name, 'as applicant');

  // 1. 创建测试产品（带库存）
  const products = await Promise.all([
    prisma.product.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: '智能开关-单路' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: '智能开关-单路',
        category: '开关类',
        standardPrice: 299,
        costPrice: 150,
        installationFee: 60,
        debuggingFee: 30,
        suggestedStockQty: 50,
        techCommissionInstall: 50,
        techCommissionDebug: 25,
        specification: '86型',
        unit: '个',
      }
    }),
    prisma.product.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: '智能窗帘电机' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: '智能窗帘电机',
        category: '窗帘类',
        standardPrice: 899,
        costPrice: 450,
        installationFee: 120,
        debuggingFee: 50,
        suggestedStockQty: 30,
        techCommissionInstall: 100,
        techCommissionDebug: 40,
        specification: 'WiFi版',
        unit: '套',
      }
    }),
    prisma.product.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: '智能门锁-A8' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: '智能门锁-A8',
        category: '门锁类',
        standardPrice: 1999,
        costPrice: 1000,
        installationFee: 150,
        debuggingFee: 60,
        suggestedStockQty: 20,
        techCommissionInstall: 120,
        techCommissionDebug: 50,
        specification: '指纹+密码',
        unit: '套',
      }
    }),
    prisma.product.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: '智能网关' } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: '智能网关',
        category: '网关类',
        standardPrice: 399,
        costPrice: 200,
        installationFee: 80,
        debuggingFee: 80,
        suggestedStockQty: 40,
        techCommissionInstall: 60,
        techCommissionDebug: 60,
        specification: 'Zigbee3.0',
        unit: '个',
      }
    }),
  ]);

  console.info('Created products:', products.map(p => p.name));

  // 2. 初始化库存
  for (const product of products) {
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { quantity: 100 },
      create: {
        tenantId: tenant.id,
        productId: product.id,
        quantity: 100,
      }
    });
  }

  console.info('Initialized inventory for all products');

  // 3. 创建测试项目
  const project = await prisma.project.upsert({
    where: { 
      tenantId_name: { 
        tenantId: tenant.id, 
        name: '万科智慧家园-样板间' 
      } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: '万科智慧家园-样板间',
      address: '深圳市南山区科技园南区',
      customerName: '张先生',
      customerPhone: '13800138000',
      contractAmount: 50000,
      signDate: new Date('2026-03-01'),
      status: 'IN_PROGRESS',
      serviceFee: 2000,
      signDiscountRate: 0.85,
    }
  });

  console.info('Created project:', project.name);

  // 4. 创建出库申请单（销售预出库）
  const salesApp = await prisma.outboundApplication.create({
    data: {
      tenantId: tenant.id,
      orderNo: `SQ${Date.now()}001`,
      type: OutboundApplicationType.SALES_PRE,
      projectId: project.id,
      applicantId: employee.id,
      status: OutboundApplicationStatus.PENDING_REVIEW,
      remark: '客户急需安装，请尽快审核',
      items: {
        create: [
          { tenantId: tenant.id, productId: products[0].id, quantity: 10, remark: '客厅+卧室' },
          { tenantId: tenant.id, productId: products[1].id, quantity: 3, remark: '主卧+次卧+书房' },
        ]
      }
    }
  });

  console.info('Created sales outbound application:', salesApp.orderNo);

  // 5. 创建出库申请单（技术预出库）
  const techApp = await prisma.outboundApplication.create({
    data: {
      tenantId: tenant.id,
      orderNo: `SQ${Date.now()}002`,
      type: OutboundApplicationType.TECH_PRE,
      projectId: project.id,
      applicantId: employee.id,
      status: OutboundApplicationStatus.PENDING_REVIEW,
      remark: '技术调试备用',
      items: {
        create: [
          { tenantId: tenant.id, productId: products[2].id, quantity: 1, remark: '入户门' },
          { tenantId: tenant.id, productId: products[3].id, quantity: 2, remark: '客厅+卧室' },
        ]
      }
    }
  });

  console.info('Created tech outbound application:', techApp.orderNo);

  // 6. 创建已审核的出库申请单（用于生成出库单）
  const approvedApp = await prisma.outboundApplication.create({
    data: {
      tenantId: tenant.id,
      orderNo: `SQ${Date.now()}003`,
      type: OutboundApplicationType.SALES_PRE,
      projectId: project.id,
      applicantId: employee.id,
      status: OutboundApplicationStatus.CONVERTED,
      finalOrderType: WarehouseOrderType.OUTBOUND_SALES,
      reviewerId: employee.id,
      reviewedAt: new Date(),
      remark: '已审核通过',
      items: {
        create: [
          { tenantId: tenant.id, productId: products[0].id, quantity: 5, remark: '客厅' },
          { tenantId: tenant.id, productId: products[1].id, quantity: 2, remark: '主卧+次卧' },
        ]
      }
    }
  });

  console.info('Created approved outbound application:', approvedApp.orderNo);

  // 7. 创建销售出库单
  const outboundOrder = await prisma.warehouseOrder.create({
    data: {
      tenantId: tenant.id,
      orderNo: `CK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
      orderType: WarehouseOrderType.OUTBOUND_SALES,
      projectId: project.id,
      operatorId: employee.id,
      paymentType: 'PAID',
      remark: '万科智慧家园项目出库',
      relatedOrderIds: approvedApp.id,
      items: {
        create: [
          { 
            tenantId: tenant.id,
            productId: products[0].id, 
            quantity: 5, 
            unitPrice: products[0].standardPrice,
            snCodes: ['SN001', 'SN002', 'SN003', 'SN004', 'SN005'],
            remark: '客厅开关' 
          },
          { 
            tenantId: tenant.id,
            productId: products[1].id, 
            quantity: 2, 
            unitPrice: products[1].standardPrice,
            snCodes: ['SN101', 'SN102'],
            remark: '主卧+次卧窗帘' 
          },
        ]
      }
    }
  });

  console.info('Created outbound order:', outboundOrder.orderNo);

  // 8. 创建采购入库单
  const inboundOrder = await prisma.warehouseOrder.create({
    data: {
      tenantId: tenant.id,
      orderNo: `RK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
      orderType: WarehouseOrderType.INBOUND_PURCHASE,
      operatorId: employee.id,
      paymentType: 'PAID',
      remark: '供应商采购入库',
      items: {
        create: [
          { 
            tenantId: tenant.id,
            productId: products[0].id, 
            quantity: 50, 
            unitPrice: products[0].costPrice,
            snCodes: Array.from({ length: 50 }, (_, i) => `SN${200 + i}`),
            remark: '智能开关批量采购' 
          },
        ]
      }
    }
  });

  console.info('Created inbound order:', inboundOrder.orderNo);

  // 9. 创建售后入库单（退货）
  const returnOrder = await prisma.warehouseOrder.create({
    data: {
      tenantId: tenant.id,
      orderNo: `SH${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
      orderType: WarehouseOrderType.INBOUND_AFTER_SALES,
      projectId: project.id,
      operatorId: employee.id,
      paymentType: 'NEED_RETURN',
      remark: '客户退货-质量问题',
      items: {
        create: [
          { 
            tenantId: tenant.id,
            productId: products[0].id, 
            quantity: 2, 
            unitPrice: products[0].standardPrice,
            snCodes: ['SN001', 'SN002'],
            remark: '开关故障退货' 
          },
        ]
      }
    }
  });

  console.info('Created return order:', returnOrder.orderNo);

  // 10. 创建借货出库单
  const loanOrder = await prisma.warehouseOrder.create({
    data: {
      tenantId: tenant.id,
      orderNo: `JH${new Date().toISOString().slice(0, 10).replace(/-/g, '')}001`,
      orderType: WarehouseOrderType.OUTBOUND_LOAN,
      projectId: project.id,
      operatorId: employee.id,
      paymentType: 'NEED_RETURN',
      remark: '借给合作伙伴展示',
      items: {
        create: [
          { 
            tenantId: tenant.id,
            productId: products[3].id, 
            quantity: 1, 
            unitPrice: products[3].standardPrice,
            snCodes: ['SN301'],
            remark: '网关展示借用' 
          },
        ]
      }
    }
  });

  console.info('Created loan order:', loanOrder.orderNo);

  console.info('\n✅ Warehouse seed completed successfully!');
  console.info('Summary:');
  console.info(`- Products: ${products.length}`);
  console.info(`- Outbound Applications: 3 (1 sales pre, 1 tech pre, 1 approved)`);
  console.info(`- Warehouse Orders: 4 (1 sales outbound, 1 purchase inbound, 1 return, 1 loan)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
