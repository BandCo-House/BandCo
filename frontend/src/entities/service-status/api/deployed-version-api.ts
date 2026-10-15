import { deployedVersionSchema } from '../model/schema';

/**
 * 지금 배포된 서비스 앱 버전을 조회한다(빌드가 함께 내는 /version.json).
 * 백엔드 API가 아니라 앱과 같은 출처의 정적 파일이라 fetch로 직접 읽고, 캐시된 옛 값을 받지 않게 한다.
 */
export const getDeployedAppVersion = async (): Promise<string> => {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`version.json 조회 실패: ${response.status}`);
  }
  return deployedVersionSchema.parse(await response.json()).version;
};
