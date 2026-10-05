import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminUserRecord, AdminUsersRepository, CreateAdminUserData, UpdateAdminUserData } from './admin-users.repository';

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  passwordHash: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  createdAt: true,
} satisfies Prisma.AdminUserSelect;

@Injectable()
export class AdminUsersPrismaRepository implements AdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<AdminUserRecord | null> {
    const client = tx ?? this.prisma;
    return client.adminUser.findUnique({ where: { id }, select: ADMIN_USER_SELECT });
  }

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<AdminUserRecord | null> {
    const client = tx ?? this.prisma;
    return client.adminUser.findUnique({ where: { email }, select: ADMIN_USER_SELECT });
  }

  async findAll(tx?: Prisma.TransactionClient): Promise<AdminUserRecord[]> {
    const client = tx ?? this.prisma;
    return client.adminUser.findMany({ select: ADMIN_USER_SELECT, orderBy: { createdAt: 'asc' } });
  }

  async create(data: CreateAdminUserData, tx?: Prisma.TransactionClient): Promise<AdminUserRecord> {
    const client = tx ?? this.prisma;
    return client.adminUser.create({ data, select: ADMIN_USER_SELECT });
  }

  async update(id: string, data: UpdateAdminUserData, tx?: Prisma.TransactionClient): Promise<AdminUserRecord> {
    const client = tx ?? this.prisma;
    return client.adminUser.update({ where: { id }, data, select: ADMIN_USER_SELECT });
  }
}
