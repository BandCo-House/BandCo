import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { BandCard } from '@/entities/band/ui/BandCard';
import { ActionFab } from '@/shared/ui/action-fab';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { BandCreateDialog } from './BandCreateDialog';
import { InviteCodeDialog } from './InviteCodeDialog';
import { useMyBands } from '@/entities/band/api/useMyBands';

export const BandList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteCodeDialogOpen, setIsInviteCodeDialogOpen] = useState(false);
  const { data: bands = [], isLoading } = useMyBands();

  const openCreate = () => setIsCreateDialogOpen(true);
  const openInviteCode = () => setIsInviteCodeDialogOpen(true);

  const dialogs = (
    <>
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

  if (isLoading) return <div data-testid="band-list">로딩 중...</div>;

  // 빈 화면에서는 FAB 대신 두 행동을 본문에 나란히 둔다. 들어온 길이 만들기인지
  // 초대인지 알 수 없어 둘 다 바로 보여야 한다.
  if (bands.length === 0)
    return (
      <section
        data-testid="band-list"
        className="flex flex-col items-center gap-4 py-10"
      >
        <EmptyState
          title="아직 참여한 밴드가 없어요"
          description="새 밴드를 만들거나 초대코드로 참여해보세요"
          className="py-0"
        />
        <div className="flex gap-3">
          <Button variant="shining" className="typo-sm-sb" onClick={openCreate}>
            새 밴드 만들기
          </Button>
          <Button
            variant="outline"
            className="typo-sm-sb"
            onClick={openInviteCode}
          >
            초대코드로 참여
          </Button>
        </div>
        {dialogs}
      </section>
    );

  return (
    <>
      <section data-testid="band-list" className="relative space-y-4">
        {/* 초대코드는 밴드가 몇 개든 쓰일 수 있어 목록 끝이 아니라 위에 고정한다.
            FAB(새 밴드)보다 위계는 낮게 글자 링크로 둔다. */}
        <div className="relative z-10 flex justify-end">
          <button
            type="button"
            onClick={openInviteCode}
            className="inline-flex items-center gap-0.5 rounded-full py-1 pl-2 typo-sm-sb text-grey-200 focus-visible:outline-2 focus-visible:outline-primary"
          >
            초대코드로 참여하기
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
        <ul className="relative z-10 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
          {bands.map((band) => (
            <li key={band.id}>
              <BandCard band={band} />
            </li>
          ))}
        </ul>

        <ActionFab
          className="bottom-24"
          label="새 밴드"
          onClick={openCreate}
          hidden={isCreateDialogOpen || isInviteCodeDialogOpen}
        />
        {dialogs}
      </section>
      <div className="pointer-events-none fixed top-header-64 z-30 -mx-5 flex h-full w-full max-w-[648px] flex-col items-start justify-start gap-6 overflow-hidden bg-linear-to-b">
        <div
          className="h-px w-full"
          style={{ boxShadow: '0px 8px 40px 10px rgba(221, 254, 85, 0.12)' }}
        />
      </div>
    </>
  );
};
