import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
} as const;

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL. Please set env or run inside docker compose api container.');
  }
  const password = await bcrypt.hash('password', 10);

  const user = await prisma.user.upsert({
    where: { email: 'founder@yoursaas.com' },
    update: {},
    create: {
      email: 'founder@yoursaas.com',
      hashedPassword: password,
      isEmailVerified: true,
      displayName: 'Founder'
    }
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'acme' },
    update: {},
    create: {
      name: 'Acme Inc',
      slug: 'acme'
    }
  });

  // 商品分类参考值（基于 2023–2025 年国内智能家居安装/调试市场公开报价，按常见单点服务拆分，供各租户自行调整）
  await prisma.productCategory.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        name: '开关类',
        // 入门级单路开关、场景面板：通常设备价 100–300 元，安装占 10%–20%，这里给出中位参考
        recommendedInstallationFee: 60,
        recommendedDebuggingFee: 30,
        recommendedOtherFee: 20,
        remark: '单点开关/场景面板，参考设备价约 10%-20%，可按项目复杂度调整'
      },
      {
        tenantId: tenant.id,
        name: '灯光类',
        // 灯具/灯带控制回路，一般布线与调试略高于单纯开关
        recommendedInstallationFee: 80,
        recommendedDebuggingFee: 40,
        recommendedOtherFee: 30,
        remark: '灯光回路/灯带控制，含基础场景调试'
      },
      {
        tenantId: tenant.id,
        name: '窗帘类',
        // 电机轨道安装+限位调试，人工和风险更高
        recommendedInstallationFee: 120,
        recommendedDebuggingFee: 50,
        recommendedOtherFee: 40,
        remark: '电动窗帘/窗纱，含轨道安装与行程调试'
      },
      {
        tenantId: tenant.id,
        name: '门锁类',
        // 智能门锁安装常见市场价单次 150–300 元
        recommendedInstallationFee: 150,
        recommendedDebuggingFee: 60,
        recommendedOtherFee: 50,
        remark: '入户智能门锁，含机械安装与联网调试'
      },
      {
        tenantId: tenant.id,
        name: '网关类',
        // 网关/中控配置主要偏调试
        recommendedInstallationFee: 80,
        recommendedDebuggingFee: 80,
        recommendedOtherFee: 40,
        remark: '中控屏/网关主机，含网络、场景基础配置'
      },
      {
        tenantId: tenant.id,
        name: '传感器类',
        recommendedInstallationFee: 50,
        recommendedDebuggingFee: 30,
        recommendedOtherFee: 20,
        remark: '门磁/人体/温湿度等简单传感器'
      },
      {
        tenantId: tenant.id,
        name: '其他',
        recommendedInstallationFee: 80,
        recommendedDebuggingFee: 40,
        recommendedOtherFee: 30,
        remark: '未分类设备的默认参考，可在商品级别单独调整'
      }
    ]
  });

  // 员工类型（用于 Skill 挂载/路由，租户可自行增删改）
  await prisma.employeeType.createMany({
    skipDuplicates: true,
    data: [
      {
        tenantId: tenant.id,
        key: 'sales',
        name: '销售',
        skillTags: ['member', 'sales']
      },
      {
        tenantId: tenant.id,
        key: 'technician',
        name: '安装工程师',
        skillTags: ['member', 'technician']
      },
      {
        tenantId: tenant.id,
        key: 'after_sales',
        name: '售后',
        skillTags: ['member', 'technician']
      },
      {
        tenantId: tenant.id,
        key: 'pm',
        name: '项目经理',
        skillTags: ['admin', 'guide']
      }
    ]
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role: Role.OWNER },
    create: { tenantId: tenant.id, userId: user.id, role: Role.OWNER }
  });

  console.info('Seed complete:', { tenant: tenant.slug, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
