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
      className="relative z-50 mx-auto flex w-37.5 cursor-pointer flex-col bg-inherit text-left"
      onClick={() =>
        navigate({ to: '/band/$bandId', params: { bandId: band.id } })
      }
    >
      <div aria-hidden="true" className="relative h-37.5 w-37.5 rounded-md">
        <img
          src={'default-band.png'}
          alt={band.name}
          className="h-full w-full rounded-md object-cover"
        />
        <span className="absolute inset-0 rounded-md bg-linear-to-b from-transparent via-black/20 to-black/80"></span>
      </div>

      <div className="absolute right-2.5 bottom-12 z-20 mt-3 flex items-center justify-end gap-1.5 typo-sm-sb text-muted">
        <div className="flex gap-1 rounded-l-full rounded-r-full border border-grey-100 bg-gradient-top px-3 py-1">
          <SVGIcon icon="Member" size="sm" className="text-grey-100" />
          <span className="text-grey-100">{band.memberCount ?? 0}명</span>
        </div>
      </div>

      <div className="flex w-full flex-col justify-between px-2 pt-3 pb-1">
        <div className="space-y-1 text-center">
          <p className="truncate typo-lg-sb text-grey-100">{band.name}</p>
        </div>
      </div>
    </button>
  );
};
