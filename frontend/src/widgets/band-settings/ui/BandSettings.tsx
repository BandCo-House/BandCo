import { useParams, useSearch } from '@tanstack/react-router';
import { useBand } from '@/entities/band/api/useBand';
import { ComingSoon } from '@/shared/ui/coming-soon';
import { BandBasicSettings } from './BandBasicSettings';

/** 밴드 설정 화면. 활성 탭은 route search(`?tab=`)가 들고 있다. */
export const BandSettings = () => {
  const { bandId } = useParams({ from: '/band/$bandId/settings' });
  const { tab } = useSearch({ from: '/band/$bandId/settings' });
  const { data: band, isLoading, isError } = useBand(bandId);

  if (tab !== 'basic') {
    return <ComingSoon />;
  }

  if (isLoading) {
    return (
      <p className="py-10 text-center typo-sm-r text-grey-300">
        밴드 정보를 불러오는 중...
      </p>
    );
  }

  if (isError || !band) {
    return (
      <p className="py-10 text-center typo-sm-r text-grey-300">
        밴드 정보를 불러오지 못했어요.
      </p>
    );
  }

  // 밴드가 바뀌면 폼 상태(이름·공개 여부·커버)를 새 밴드 값으로 다시 잡아야 한다.
  return <BandBasicSettings key={band.id} band={band} />;
};
