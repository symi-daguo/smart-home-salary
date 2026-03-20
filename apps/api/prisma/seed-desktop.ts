import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

const prisma = new PrismaClient();

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

  const owner = await upsertUser('founder@yoursaas.com', 'Founder', passwordHash);
  const adminUser = await upsertUser('admin@demo.local', 'Admin Demo', passwordHash);

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: owner.id } },
    update: { role: Role.OWNER },
    create: { tenantId: tenant.id, userId: owner.id, role: Role.OWNER },
  });

  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: adminUser.id } },
    update: { role: Role.ADMIN },
    create: { tenantId: tenant.id, userId: adminUser.id, role: Role.ADMIN },
  });

  await prisma.employeeType.createMany({
    data: [
      { tenantId: tenant.id, key: 'member', name: '员工', skillTags: 'member' },
      { tenantId: tenant.id, key: 'admin', name: '管理员', skillTags: 'admin,guide' },
      { tenantId: tenant.id, key: 'sales', name: '销售', skillTags: 'member,sales' },
      { tenantId: tenant.id, key: 'technician', name: '安装工程师', skillTags: 'member,technician' },
    ],
  });

  await prisma.position.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: '销售岗',
        baseSalary: 6000,
        commissionRule: '{}',
        phoneAllowance: 200,
        transportAllowance: 200,
        otherAllowance: 100,
      },
      {
        tenantId: tenant.id,
        name: '技术岗',
        baseSalary: 7000,
        commissionRule: '{}',
        phoneAllowance: 200,
        transportAllowance: 300,
        otherAllowance: 100,
      },
      {
        tenantId: tenant.id,
        name: '管理岗',
        baseSalary: 9000,
        commissionRule: '{}',
        phoneAllowance: 300,
        transportAllowance: 300,
        otherAllowance: 300,
      },
    ],
  });

  console.log('✅ Desktop seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
