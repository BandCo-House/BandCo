import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import { ADMIN_USERS_REPOSITORY, type AdminUsersRepository, type UpdateAdminUserData } from './repositories/admin-users.repository';
import type { CreateAdminInput, UpdateAdminInput } from './types/admin-account.type';
import type { AdminPrincipal, AdminProfile } from './types/admin-principal.type';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { AdminAuthService, normalizeAdminEmail } from './admin-auth.service';
import { toAdminProfile } from './admin-profile.mapper';

const DUPLICATE_ADMIN_EMAIL_MESSAGE = '이미 등록된 어드민 이메일입니다.';

@Injectable()
export class AdminAccountsService {
  constructor(
    @Inject(ADMIN_USERS_REPOSITORY)
    private readonly adminUsersRepository: AdminUsersRepository,
    private readonly adminAuthService: AdminAuthService,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 어드민 계정 전체를 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ admins: AdminProfile[] }>} 어드민 목록
   */
  async getAdmins(tx?: Prisma.TransactionClient): Promise<{ admins: AdminProfile[] }> {
    const admins = await this.adminUsersRepository.findAll(tx);
    return { admins: admins.map(toAdminProfile) };
  }

  /**
   * 새 어드민 계정을 만든다. 이메일은 소문자로 정규화해 중복을 막는다.
   *
   * @param {AdminPrincipal} actor - 요청한 SUPER_ADMIN
   * @param {CreateAdminInput} input - 생성 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminProfile>} 생성된 계정
   */
  async createAdmin(actor: AdminPrincipal, input: CreateAdminInput, tx?: Prisma.TransactionClient): Promise<AdminProfile> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminProfile> => {
      const email = normalizeAdminEmail(input.email);
      const existing = await this.adminUsersRepository.findByEmail(email, client);
      if (existing !== null) {
        throw new ConflictException(DUPLICATE_ADMIN_EMAIL_MESSAGE);
      }

      const passwordHash = await this.adminAuthService.hashPassword(input.password);
      const created = await this.createWithDuplicateEmailGuard(() =>
        this.adminUsersRepository.create({ email, passwordHash, name: input.name, role: input.role }, client),
      );
      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'ADMIN_CREATE', targetType: 'ADMIN', targetId: created.id, detail: { email, role: input.role } },
        client,
      );

      return toAdminProfile(created);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 어드민 이름·역할·활성 여부를 바꾼다.
   * 본인을 강등·비활성화하면 SUPER_ADMIN이 한 명도 남지 않는 상황이 생길 수 있어 막는다.
   *
   * @param {AdminPrincipal} actor - 요청한 SUPER_ADMIN
   * @param {string} adminId - 대상 어드민 ID
   * @param {UpdateAdminInput} input - 변경 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminProfile>} 수정된 계정
   */
  async updateAdmin(actor: AdminPrincipal, adminId: string, input: UpdateAdminInput, tx?: Prisma.TransactionClient): Promise<AdminProfile> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminProfile> => {
      const isSelf = actor.id === adminId;
      if (isSelf && input.role !== undefined && input.role !== 'SUPER_ADMIN') {
        throw new BadRequestException('본인의 역할은 낮출 수 없습니다.');
      }
      if (isSelf && input.isActive === false) {
        throw new BadRequestException('본인 계정은 비활성화할 수 없습니다.');
      }

      const target = await this.adminUsersRepository.findById(adminId, client);
      if (target === null) {
        throw new NotFoundException('어드민 계정을 찾을 수 없습니다.');
      }

      const data: UpdateAdminUserData = { name: input.name, role: input.role, isActive: input.isActive };
      const updated = await this.adminUsersRepository.update(adminId, data, client);
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'ADMIN_UPDATE',
          targetType: 'ADMIN',
          targetId: adminId,
          detail: { name: input.name ?? null, role: input.role ?? null, isActive: input.isActive ?? null },
        },
        client,
      );

      return toAdminProfile(updated);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 다른 어드민의 비밀번호를 초기화한다. 분실 계정 복구용이다.
   *
   * @param {AdminPrincipal} actor - 요청한 SUPER_ADMIN
   * @param {string} adminId - 대상 어드민 ID
   * @param {string} newPassword - 새 비밀번호
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ adminId: string }>} 대상 어드민 ID
   */
  async resetAdminPassword(actor: AdminPrincipal, adminId: string, newPassword: string, tx?: Prisma.TransactionClient): Promise<{ adminId: string }> {
    const run = async (client: Prisma.TransactionClient): Promise<{ adminId: string }> => {
      const target = await this.adminUsersRepository.findById(adminId, client);
      if (target === null) {
        throw new NotFoundException('어드민 계정을 찾을 수 없습니다.');
      }

      const passwordHash = await this.adminAuthService.hashPassword(newPassword);
      // 초기화 전에 발급된 토큰은 가드에서 거부된다(유출 계정 복구 용도)
      await this.adminUsersRepository.update(adminId, { passwordHash, passwordChangedAt: new Date() }, client);
      await this.auditLogsService.record({ adminUserId: actor.id, action: 'ADMIN_PASSWORD_RESET', targetType: 'ADMIN', targetId: adminId }, client);

      return { adminId };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 사전 중복 검사와 저장 사이에 같은 이메일 생성이 끼어들 수 있어, 유니크 제약 위반(P2002)도 같은 409로 바꾼다.
   */
  private async createWithDuplicateEmailGuard<T>(create: () => Promise<T>): Promise<T> {
    try {
      return await create();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(DUPLICATE_ADMIN_EMAIL_MESSAGE);
      }
      throw error;
    }
  }
}
