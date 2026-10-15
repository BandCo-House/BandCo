import type { Prisma } from 'src/generated/prisma';

import type { AdminServiceSettings, UpdateServiceSettingsInput } from '../types/admin-service-settings.type';

export const ADMIN_SERVICE_SETTINGS_REPOSITORY = Symbol('ADMIN_SERVICE_SETTINGS_REPOSITORY');

export interface AdminServiceSettingsRepository {
  /**
   * 서비스 설정 행(id=1)을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminServiceSettings | null>} 서비스 설정. 행이 없으면 null
   */
  findServiceSettings(tx?: Prisma.TransactionClient): Promise<AdminServiceSettings | null>;

  /**
   * 서비스 설정 행(id=1)을 만들거나 고친다. undefined 필드는 바꾸지 않는다.
   *
   * @param {UpdateServiceSettingsInput} input - 바꿀 값
   * @param {string} updatedByAdminId - 변경한 어드민 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminServiceSettings>} 저장된 서비스 설정
   */
  upsertServiceSettings(input: UpdateServiceSettingsInput, updatedByAdminId: string, tx?: Prisma.TransactionClient): Promise<AdminServiceSettings>;
}
