import { Link, useParams } from '@tanstack/react-router';
import SettingIcon from '@/assets/icons/setting.svg?react';

/**
 * 밴드 메인 헤더 우측 설정 아이콘.
 * 홈/아카이브/라이브러리 라우트가 공유하므로 bandId는 레이아웃 라우트에서 읽는다.
 */
export const BandSettingsAction = () => {
  const { bandId } = useParams({ from: '/band/$bandId' });
  return (
    <Link
      to="/band/$bandId/settings"
      params={{ bandId }}
      search={{ tab: 'basic' }}
      aria-label="밴드 설정"
      className="inline-flex size-10 items-center justify-center rounded-full text-grey-100"
    >
      <SettingIcon aria-hidden="true" className="size-6" />
    </Link>
  );
};
