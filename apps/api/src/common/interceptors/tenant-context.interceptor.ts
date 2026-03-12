import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, Subscription } from 'rxjs';
import { TenantContextService } from '../tenant-context/tenant-context.service';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as {
      sub?: string;
      roles?: string[];
      tenantId?: string;
      activeTenantId?: string;
    };
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const jwtTenant = user?.activeTenantId || user?.tenantId;
    const host = (req.headers.host as string | undefined) ?? '';
    const subdomainTenant = this.extractTenantFromHost(host);

    const tenantId = headerTenantId || jwtTenant || subdomainTenant;
    req.tenantId = tenantId;

    // Guards 会在 Interceptor 之前运行；这里需要确保**订阅发生在 ALS 上下文中**
    // 否则 PrismaService 读取不到 tenantId（AsyncLocalStorage 丢上下文）
    return new Observable((subscriber) => {
      let innerSub: Subscription | undefined;
      this.tenantContext.runWithContext({ tenantId, userId: user?.sub, roles: user?.roles ?? [] }, () => {
        innerSub = next.handle().subscribe(subscriber);
      });
      return () => {
        innerSub?.unsubscribe();
      };
    });
  }

  private extractTenantFromHost(host: string): string | undefined {
    const parts = host.split('.');
    if (parts.length < 3) {
      return undefined;
    }
    // Ignore localhost with port
    if (host.includes('localhost')) {
      return undefined;
    }
    return parts[0];
  }
}
