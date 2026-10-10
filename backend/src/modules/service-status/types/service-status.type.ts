/** 서비스 설정은 id=1 한 행만 쓴다. */
export const SERVICE_SETTING_ROW_ID = 1;

/** 앱·점검 미들웨어가 쓰는 공개 서비스 상태 */
export type ServiceStatus = {
  maintenanceEnabled: boolean;
  maintenanceMessage: string | null;
  minAppVersion: string | null;
};

/** 설정 행이 아직 없을 때 응답하는 기본값 */
export const DEFAULT_SERVICE_STATUS: Readonly<ServiceStatus> = Object.freeze({
  maintenanceEnabled: false,
  maintenanceMessage: null,
  minAppVersion: null,
});

/** 공개 공지 응답 항목 */
export type ActiveAnnouncement = {
  announcementId: string;
  title: string;
  content: string;
  startsAt: string | null;
  endsAt: string | null;
};
