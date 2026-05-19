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
      className="relative w-full bg-inherit"
      onClick={() =>
        navigate({ to: '/band/$bandId', params: { bandId: band.id } })
      }
    >
      <div aria-hidden="true" className="w-full">
        <img src={'default-band.png'} alt={band.name} className="w-full" />
      </div>

      <div className="flex items-center justify-end gap-1.5 typo-sm-m text-muted">
        <div className="flex gap-1 rounded-l-full rounded-r-full border border-grey-200 px-3 py-1">
          <SVGIcon icon="Member" size="sm" className="text-grey-200" />
          <span className="text-grey-200">{band.memberCount ?? 0}명</span>
        </div>
      </div>

      <div className="flex min-h-24 flex-col justify-between px-2 pt-4 pb-1">
        <div className="space-y-1 text-center">
          <p className="truncate typo-lg-sb text-grey-200">{band.name}</p>
        </div>
      </div>
    </button>
  );
};
