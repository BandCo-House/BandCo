import { createFileRoute } from '@tanstack/react-router';
import { getBand } from '@/entities/band/api/band-api';
import { BandLibrary } from '@/widgets/band-library';
import { bandMainTabStaticData } from './-band-main-route';

export const Route = createFileRoute('/band/$bandId/library')({
  component: BandLibraryRoutePage,
  loader: ({ params }) => getBand(params.bandId),
  staticData: bandMainTabStaticData,
});

// 밴드 라이브러리 라우트 — 합주곡 / 연습 장소
function BandLibraryRoutePage() {
  return (
    <>
      <span className="sr-only">BandLibraryPage</span>
      <BandLibrary />
    </>
  );
}
