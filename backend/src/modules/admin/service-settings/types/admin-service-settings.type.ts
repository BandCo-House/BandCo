/** 어드민 서비스 설정 응답 형식 */
export type AdminServiceSettings = {
  maintenanceEnabled: boolean;
  maintenanceMessage: string | null;
  minAppVersion: string | null;
  updatedAt: string | null;
  updatedBy: { adminId: string; name: string } | null;
};

/** 설정 행이 아직 없을 때 응답하는 기본값 */
export const DEFAULT_ADMIN_SERVICE_SETTINGS: Readonly<AdminServiceSettings> = Object.freeze({
  maintenanceEnabled: false,
  maintenanceMessage: null,
  minAppVersion: null,
  updatedAt: null,
  updatedBy: null,
});

/** 서비스 설정 변경 요청값. undefined는 변경 없음, 문자열 필드의 null은 값 비우기다. */
export type UpdateServiceSettingsInput = {
  maintenanceEnabled?: boolean;
  maintenanceMessage?: string | null;
  minAppVersion?: string | null;
};
