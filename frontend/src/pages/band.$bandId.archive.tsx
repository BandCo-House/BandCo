import { createFileRoute } from '@tanstack/react-router';
import { ComingSoon } from '@/shared/ui/coming-soon';
import { bandMainTabStaticData } from './-band-main-route';

export const Route = createFileRoute('/band/$bandId/archive')({
  component: BandArchiveRoutePage,
  staticData: bandMainTabStaticData,
});

// 밴드 아카이브 라우트 — 준비 중
function BandArchiveRoutePage() {
  return (
    <>
      <span className="sr-only">BandArchivePage</span>
      <ComingSoon />
    </>
  );
}
