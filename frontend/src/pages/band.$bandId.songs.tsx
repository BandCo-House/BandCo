import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/shared/ui/coming-soon';
import {
  getSpaceIdFromLocationSearch,
  parseSongsSearch,
  resolveSongsHeader,
} from './-band-header-utils';

export const Route = createFileRoute('/band/$bandId/songs')({
  validateSearch: parseSongsSearch,
  loader: ({ location }) => {
    return {
      spaceId: getSpaceIdFromLocationSearch(location.search),
    };
  },
  component: BandSongsRoutePage,
  staticData: {
    header: {
      title: '곡 라이브러리',
      backTo: '/band/$bandId',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      rightActionLabel: '설정',
      rightActionTo: '/band/$bandId/settings',
      getRightActionParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      resolve: resolveSongsHeader,
    },
  },
});

// 밴드 공용 곡 라이브러리 라우트 전용 화면
function BandSongsRoutePage() {
  return (
    <>
      <span className="sr-only">SongsPage</span>
      <ComingSoon />
    </>
  );
}
