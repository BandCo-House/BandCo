import { useNavigate } from '@tanstack/react-router';
import { SVGIcon } from '@/shared/ui/icon';
import type { Band } from '../model/types';

type BandCardProps = {
  band: Band;
};

export const BandCard = ({ band }: BandCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      aria-label={`${band.name} 상세 보기`}
      className="motion-lift flex w-full flex-col rounded-3xl border border-muted/30 bg-card p-3 shadow-xl/5"
      onClick={() =>
        navigate({ to: '/band/$bandId', params: { bandId: band.id } })
      }
    >
      <div aria-hidden="true" className="aspect-square rounded-xl bg-muted-foreground" />

      <div className="flex min-h-24 flex-col justify-between px-2 pb-1 pt-4">
        <div className="space-y-1 text-center">
          <p className="typo-lg-sb truncate">
            {band.name}
          </p>
          {band.description ? (
            <p className="typo-sm-r line-clamp-1 text-muted">
              {band.description}
            </p>
          ) : null}
        </div>

        <div className="typo-sm-m flex items-center justify-end gap-1.5 text-muted">
          <SVGIcon icon="Member" size="sm" />
          <span>{band.memberCount ?? 0}명</span>
        </div>
      </div>
    </button>
  );
};
