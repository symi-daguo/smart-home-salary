import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Missing DATABASE_URL. Please set env or run inside docker compose api container.');
  }
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'acme' } });
  if (!tenant) {
    console.info('No tenant(acme). Nothing to cleanup.');
    return;
  }

  // Only cleanup demo data:
  // - Users with email ending in @demo.local
  // - Records with name/title prefix TEST- or remark/message containing TESTDATA
  const demoUsers = await prisma.user.findMany({
    where: { email: { endsWith: '@demo.local' } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  const demoMemberships = await prisma.membership.findMany({
    where: { tenantId: tenant.id, userId: { in: demoUserIds } },
    select: { id: true },
  });
  const demoMembershipIds = demoMemberships.map((m) => m.id);

  const demoEmployees = await prisma.employee.findMany({
    where: { tenantId: tenant.id, membershipId: { in: demoMembershipIds } },
    select: { id: true },
  });
  const demoEmployeeIds = demoEmployees.map((e) => e.id);

  // Delete in dependency order
  await prisma.salesOrderItem.deleteMany({
    where: { tenantId: tenant.id, salesOrder: { remark: { contains: 'TESTDATA' } } },
  });
  await prisma.salesOrder.deleteMany({
    where: { tenantId: tenant.id, remark: { contains: 'TESTDATA' } },
  });
  await prisma.installationRecord.deleteMany({
    where: { tenantId: tenant.id, description: { contains: 'TESTDATA' } },
  });
  await prisma.salary.deleteMany({
    where: { tenantId: tenant.id, employeeId: { in: demoEmployeeIds } },
  });
  await prisma.alert.deleteMany({
    where: {
      tenantId: tenant.id,
      OR: [{ title: { startsWith: 'TESTDATA' } }, { message: { contains: 'TESTDATA' } }],
    },
  });

  await prisma.curtainRoom.deleteMany({
    where: { tenantId: tenant.id, order: { remark: { contains: 'TESTDATA' } } },
  });
  await prisma.curtainOrder.deleteMany({
    where: { tenantId: tenant.id, remark: { contains: 'TESTDATA' } },
  });
  await prisma.measurementSurvey.deleteMany({
    where: { tenantId: tenant.id, remark: { contains: 'TESTDATA' } },
  });

  await prisma.projectItem.deleteMany({
    where: { tenantId: tenant.id, project: { name: { startsWith: 'TEST-' } } },
  });
  await prisma.project.deleteMany({
    where: { tenantId: tenant.id, name: { startsWith: 'TEST-' } },
  });

  await prisma.employee.deleteMany({
    where: { tenantId: tenant.id, id: { in: demoEmployeeIds } },
  });
  await prisma.membership.deleteMany({
    where: { tenantId: tenant.id, id: { in: demoMembershipIds } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: demoUserIds } },
  });

  await prisma.product.deleteMany({
    where: { tenantId: tenant.id, name: { startsWith: 'TEST-' } },
  });
  await prisma.position.deleteMany({
    where: { tenantId: tenant.id, name: { startsWith: 'TEST-' } },
  });

  console.info('Cleanup testdata complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

