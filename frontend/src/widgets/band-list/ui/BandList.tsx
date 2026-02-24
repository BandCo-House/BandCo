import { BandCard } from '@/entities/band/ui/BandCard';
import { useBands } from '@/entities/band/api/useBands';

export const BandList = () => {
  const { data: bands = [], isLoading } = useBands();

  if (isLoading) return <div data-testid="band-list">로딩 중...</div>;

  if (bands.length === 0)
    return <div data-testid="band-list">아직 참여한 밴드가 없어요</div>;

  return (
    <div data-testid="band-list">
      <ul>
        {bands.map((band) => (
          <li key={band.id}>
            <BandCard band={band} />
          </li>
        ))}
      </ul>
    </div>
  );
};
