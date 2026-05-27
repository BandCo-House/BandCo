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
      <section data-testid="band-list" className="relative space-y-7">
        <ul className="relative z-10 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
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
      </section>
      <div className="fixed top-header-64 z-30 -mx-5 flex h-full w-full max-w-[648px] flex-col items-start justify-start gap-6 overflow-hidden bg-linear-to-b pointer-events-none">
        <div
          className="h-px w-full"
          style={{ boxShadow: '0px 8px 40px 10px rgba(221, 254, 85, 0.12)' }}
        />
      </div>
    </>
  );
};
