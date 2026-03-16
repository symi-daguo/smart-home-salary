import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
      tenants: user.memberships.map(
        (m: { tenant: { id: string; name: string; slug: string }; role: string }) => ({
          id: m.tenant.id,
          name: m.tenant.name,
          slug: m.tenant.slug,
          role: m.role,
        }),
      ),
    };
  }

  // 管理员功能：获取租户下所有用户
  async findAllByTenant(tenantId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { tenantId },
      include: {
        user: true,
      },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      displayName: m.user.displayName,
      roles: [m.role],
      isActive: m.user.isEmailVerified ?? true,
      createdAt: m.user.createdAt,
      lastLoginAt: m.user.updatedAt,
    }));
  }

  // 管理员功能：创建用户
  async createUser(
    tenantId: string,
    data: {
      email: string;
      displayName?: string;
      password: string;
      roles: string[];
      isActive?: boolean;
    },
  ) {
    // 检查邮箱是否已存在
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new BadRequestException('该邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        displayName: data.displayName,
        hashedPassword: hashedPassword,
        isEmailVerified: data.isActive ?? true,
      },
    });

    // 创建租户成员关系
    await this.prisma.membership.create({
      data: {
        userId: user.id,
        tenantId,
        role: (data.roles[0] as any) || 'MEMBER',
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: data.roles,
      isActive: data.isActive ?? true,
      createdAt: user.createdAt,
    };
  }

  // 管理员功能：更新用户
  async updateUser(
    tenantId: string,
    userId: string,
    data: {
      displayName?: string;
      roles?: string[];
      isActive?: boolean;
    },
  ) {
    // 检查用户是否存在
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 更新用户信息
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        isEmailVerified: data.isActive,
      },
    });

    // 更新成员关系
    if (data.roles && data.roles.length > 0) {
      await this.prisma.membership.updateMany({
        where: { userId, tenantId },
        data: { role: data.roles[0] as any },
      });
    }

    return {
      id: userId,
      displayName: data.displayName,
      roles: data.roles,
      isActive: data.isActive,
    };
  }

  // 管理员功能：删除用户
  async deleteUser(tenantId: string, userId: string) {
    // 检查用户是否存在
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 删除成员关系
    await this.prisma.membership.deleteMany({
      where: { userId, tenantId },
    });

    // 删除用户
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  // 管理员功能：重置密码
  async resetPassword(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const defaultPassword = 'password';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedPassword: hashedPassword },
    });

    return { success: true, defaultPassword };
  }
}
