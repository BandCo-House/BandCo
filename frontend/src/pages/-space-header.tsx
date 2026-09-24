import { SpaceTabs } from '@/widgets/space-tabs';

/**
 * 합주 공간 라우트들이 공유하는 헤더 하단 탭 렌더러.
 * 라우트마다 새 함수를 만들면 RouteHeader가 탭을 매번 리마운트해
 * 슬라이딩 인디케이터 애니메이션이 끊긴다(밴드 메인 탭과 같은 이유로 공유한다).
 */
export const renderSpaceTabs = () => <SpaceTabs />;
