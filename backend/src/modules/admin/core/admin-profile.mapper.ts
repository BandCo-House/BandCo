import type { AdminUserRecord } from './repositories/admin-users.repository';
import type { AdminProfile } from './types/admin-principal.type';

/**
 * 비밀번호 해시가 응답에 섞이지 않도록 어드민 계정을 응답 형식으로 바꾼다.
 *
 * @param {AdminUserRecord} admin - 조회한 어드민 계정
 * @returns {AdminProfile} 응답용 어드민 정보
 */
export function toAdminProfile(admin: AdminUserRecord): AdminProfile {
  return {
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    createdAt: admin.createdAt.toISOString(),
  };
}
