import { ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { TenantContextService } from '../tenant-context/tenant-context.service';

function makeExecutionContext(req: any) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any;
}

describe('TenantGuard', () => {
  it('throws when tenant context missing', async () => {
    const tenantContext = new TenantContextService();
    const prisma = {
      membership: { findUnique: jest.fn() },
    } as any;
    const guard = new TenantGuard(tenantContext, prisma);

    await expect(guard.canActivate(makeExecutionContext({ headers: {}, user: { sub: 'u1' } }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws when user not member of tenant', async () => {
    const tenantContext = new TenantContextService();
    const prisma = {
      membership: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any;
    const guard = new TenantGuard(tenantContext, prisma);

    await expect(
      guard.canActivate(
        makeExecutionContext({
          headers: { 'x-tenant-id': 't1' },
          user: { sub: 'u1', roles: ['ADMIN'] },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows when tenant header present and membership exists', async () => {
    const tenantContext = new TenantContextService();
    const prisma = {
      membership: { findUnique: jest.fn().mockResolvedValue({ id: 'm1' }) },
    } as any;
    const guard = new TenantGuard(tenantContext, prisma);
    const req: any = { headers: { 'x-tenant-id': 't1' }, user: { sub: 'u1', roles: ['ADMIN'] } };

    await expect(guard.canActivate(makeExecutionContext(req))).resolves.toBe(true);
    expect(req.tenantId).toBe('t1');
    expect(tenantContext.getTenantId()).toBe('t1');
  });
});

