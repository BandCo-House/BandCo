import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import SettingIcon from '@/assets/icons/setting.svg?react';
import { BandMain, BandMainTabs } from '@/widgets/band-main';
import { resolveBandDetailHeader } from './-band-header-utils';

// 헤더 우측 설정 아이콘. renderRight 안에서 useParams로 bandId를 읽어 설정 경로를 만든다.
function BandSettingsAction() {
  const { bandId } = useParams({ from: '/band/$bandId/' });
  return (
    <Link
      to="/band/$bandId/settings"
      params={{ bandId }}
      aria-label="밴드 설정"
      className="inline-flex size-10 items-center justify-center rounded-full text-grey-100"
    >
      <SettingIcon aria-hidden="true" className="size-6" />
    </Link>
  );
}

export const Route = createFileRoute('/band/$bandId/')({
  component: BandDetailRoutePage,
  staticData: {
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
  },
});

// 밴드 상세(메인/홈) 라우트 전용 화면
function BandDetailRoutePage() {
  return (
    <>
      <span className="sr-only">BandDetailPage</span>
      <BandMain />
    </>
  );
}
