import type { Band } from '../model/types';

type BandCardProps = {
  band: Band;
};

export const BandCard = ({ band }: BandCardProps) => {
  return (
    <div>
      <span>{band.name}</span>
      <span>{band.memberCount}</span>
    </div>
  );
};
