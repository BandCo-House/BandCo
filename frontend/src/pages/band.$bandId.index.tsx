import { createFileRoute } from '@tanstack/react-router';
import { getBand } from '@/entities/band/api/band-api';
import { BandMain } from '@/widgets/band-main';
import { bandMainTabStaticData } from './-band-main-route';

export const Route = createFileRoute('/band/$bandId/')({
  component: BandDetailRoutePage,
  loader: ({ params }) => getBand(params.bandId),
  staticData: bandMainTabStaticData,
});

// 밴드 상세(메인/홈) 라우트 전용 화면
function BandDetailRoutePage() {
  return (
    <>
      <span data-testid="band-detail-page" className="hidden" />
      <BandMain />
    </>
  );
}
