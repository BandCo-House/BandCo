import { useState } from 'react';
import { BandCard } from '@/entities/band/ui/BandCard';
import { useBands } from '@/entities/band/api/useBands';
import { BandCreateDialog } from './BandCreateDialog';
import { InviteCodeDialog } from './InviteCodeDialog';
import { BandListFAB } from './BandListFAB';

export const BandList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteCodeDialogOpen, setIsInviteCodeDialogOpen] = useState(false);
  const { data: bands = [], isLoading } = useBands();

  if (isLoading) return <div data-testid="band-list">로딩 중...</div>;

  if (bands.length === 0)
    return (
      <>
        <div data-testid="band-list">아직 참여한 밴드가 없어요</div>
        <BandListFAB
          onCreateClick={() => setIsCreateDialogOpen(true)}
          onInviteClick={() => setIsInviteCodeDialogOpen(true)}
        />
        <BandCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
        <InviteCodeDialog
          open={isInviteCodeDialogOpen}
          onOpenChange={setIsInviteCodeDialogOpen}
        />
      </>
    );

  return (
    <>
      <section
        data-testid="band-list"
        className="relative space-y-7 bg-primary"
      >
        <ul className="relative z-30 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
          {bands.map((band) => (
            <li key={band.id}>
              <BandCard band={band} />
            </li>
          ))}
        </ul>

        <BandListFAB
          onCreateClick={() => setIsCreateDialogOpen(true)}
          onInviteClick={() => setIsInviteCodeDialogOpen(true)}
        />

        <BandCreateDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
        <InviteCodeDialog
          open={isInviteCodeDialogOpen}
          onOpenChange={setIsInviteCodeDialogOpen}
        />
        <div className="fixed top-20 left-1/2 z-10 h-full w-full max-w-[648px] -translate-x-1/2 bg-linear-to-b from-black/50 via-black/20 to-white/10" />
      </section>
    </>
  );
};
