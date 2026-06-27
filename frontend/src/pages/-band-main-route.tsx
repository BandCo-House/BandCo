import { BandMainTabs, BandSettingsAction } from '@/widgets/band-main';
import type { RouteStaticData } from '@/widgets/page-header';
import { resolveBandDetailHeader } from './-band-header-utils';

/**
 * 밴드 메인 탭(홈/아카이브/라이브러리)이 공유하는 헤더 staticData.
 * 세 라우트가 동일한 헤더·탭·설정 버튼을 갖도록 한 곳에서 관리한다.
 */
export const bandMainTabStaticData: RouteStaticData = {
  fullBleed: true,
  header: {
    title: '밴드',
    brandLabel: '밴드',
    showBack: true,
    backTo: '/my-bands',
    renderRight: () => <BandSettingsAction />,
    renderBottom: () => <BandMainTabs />,
    bottomBlur: true,
    resolve: resolveBandDetailHeader,
  },
};
