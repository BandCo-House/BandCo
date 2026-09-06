import { createFileRoute } from '@tanstack/react-router';
import { getBand } from '@/entities/band/api/band-api';
import { ComingSoon } from '@/shared/ui/coming-soon';
import { bandMainTabStaticData } from './-band-main-route';

export const Route = createFileRoute('/band/$bandId/archive')({
  component: BandArchiveRoutePage,
  loader: ({ params }) => getBand(params.bandId),
  staticData: bandMainTabStaticData,
});

// 밴드 아카이브 라우트 — 준비 중
function BandArchiveRoutePage() {
  return (
    <>
      <span data-testid="band-archive-page" className="hidden" />
      <ComingSoon />
    </>
  );
}
