import { Button } from '@/shared/ui/button';
import { SVGIcon } from '@/shared/ui/icon';
import { BandCard } from '@/entities/band/ui/BandCard';
import { useBands } from '@/entities/band/api/useBands';

export const BandList = () => {
  const { data: bands = [], isLoading } = useBands();

  if (isLoading) return <div data-testid="band-list">로딩 중...</div>;

  if (bands.length === 0)
    return <div data-testid="band-list">아직 참여한 밴드가 없어요</div>;

  return (
    <section data-testid="band-list" className="space-y-7">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-5">
          <h2 className="text-4xl font-semibold tracking-tight">밴드</h2>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              className="h-11 rounded-full bg-secondary-surface px-5 text-sm font-semibold text-secondary-foreground shadow-xl/5"
            >
              <span>밴드 만들기</span>
              <SVGIcon icon="AddWithCircle" size="sm" />
            </Button>

            <Button
              type="button"
              className="h-11 rounded-full bg-secondary-surface px-5 text-sm font-semibold text-secondary-foreground shadow-xl/5"
            >
              <span>초대 코드 입력</span>
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="gap-2 px-0 text-sm font-medium text-muted hover:text-foreground"
        >
          <span>목록 편집</span>
          <SVGIcon icon="Setting" size="sm" />
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bands.map((band) => (
          <li key={band.id}>
            <BandCard band={band} />
          </li>
        ))}
      </ul>
    </section>
  );
};
