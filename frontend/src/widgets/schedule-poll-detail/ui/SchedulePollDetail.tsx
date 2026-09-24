import { useState } from 'react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import MemberIcon from '@/assets/icons/member.svg?react';
import { formatDotDate } from '@/shared/lib/date';
import { getApiErrorMessage } from '@/shared/api/error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { useSpace } from '@/entities/space/api/useSpace';
import { useSchedulePoll } from '@/entities/schedule-poll/model/queries';
import {
  buildPollGrid,
  chunkDateKeys,
  collectPollVoters,
  maxVoteCount,
} from '@/entities/schedule-poll/lib/poll-grid';
import { SchedulePollGrid } from '@/entities/schedule-poll/ui/SchedulePollGrid';
import { useUpdateMySchedulePollVote } from '@/features/schedule-poll-vote/api/use-update-my-vote';

interface SchedulePollDetailProps {
  spaceId: string;
  pollId: string;
}

/** 일정 투표 상세. 득표 현황 그리드와 내 투표 편집(드래그)을 오간다. */
export const SchedulePollDetail = ({
  spaceId,
  pollId,
}: SchedulePollDetailProps) => {
  const { data: poll } = useSchedulePoll(pollId);
  const { data: spaceDetail } = useSpace(spaceId);
  const updateVote = useUpdateMySchedulePollVote(pollId);

  const [pageIndex, setPageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draftOptionIds, setDraftOptionIds] = useState<string[]>([]);
  // 렌더 순수성 규칙 때문에 현재 시각은 마운트 시점에 한 번만 잡는다(화면 진입 기준 마감 판정).
  const [enteredAt] = useState(() => Date.now());

  if (!poll) return null;

  const grid = buildPollGrid(poll.options);
  const pages = chunkDateKeys(grid.dateKeys);
  const page = Math.min(pageIndex, Math.max(pages.length - 1, 0));
  const voters = collectPollVoters(poll.options);
  const hasVoted = poll.myOptionIds.length > 0;
  // 마감된 투표는 백엔드가 투표 등록·수정을 400으로 거부하므로 편집 진입 자체를 막는다.
  const isClosed = new Date(poll.closesAt).getTime() <= enteredAt;

  const startEditing = () => {
    setDraftOptionIds(poll.myOptionIds);
    setIsEditing(true);
  };

  const submitVote = () => {
    updateVote.mutate(draftOptionIds, {
      onSuccess: () => setIsEditing(false),
      onError: (error) => {
        toast.error(getApiErrorMessage(error, '투표 반영에 실패했어요.'));
      },
    });
  };

  const handleToggleOption = (optionId: string, selected: boolean) => {
    // 터치 드래그는 재렌더 전에 같은 셀 이벤트가 연달아 올 수 있어 중복 추가를 막는다.
    // 중복 ID가 실리면 백엔드가 400으로 투표 전체를 거부한다.
    setDraftOptionIds((prev) => {
      if (!selected) return prev.filter((id) => id !== optionId);
      return prev.includes(optionId) ? prev : [...prev, optionId];
    });
  };

  const ctaLabel = isEditing
    ? hasVoted
      ? '수정 완료'
      : '투표 완료'
    : hasVoted
      ? '투표 수정하기'
      : '일정 투표하기';

  return (
    <div className="flex w-full flex-col gap-6 pb-36">
      <header className="flex flex-col gap-2 px-5">
        <h2 className="typo-lg-sb text-grey-50">{poll.name}</h2>
        {isEditing ? (
          <p className="typo-sm-r text-grey-200">
            참여할 수 있는 시간을 드래그해보세요
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <p className="typo-sm-r text-grey-200">투표 마감 기한</p>
              <p className="typo-sm-r text-grey-50">
                {formatDotDate(poll.closesAt)}
              </p>
              {isClosed && <p className="typo-sm-r text-destructive">마감됨</p>}
            </div>
            <div className="flex items-center gap-3">
              <p className="typo-sm-r text-grey-200">참여 인원</p>
              <p className="typo-sm-r text-grey-50">
                {poll.voterCount}
                {spaceDetail?.memberCount !== undefined
                  ? `/${spaceDetail.memberCount}`
                  : ''}
              </p>
              <div className="flex flex-1 justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="-m-2 flex items-center gap-2 p-2 typo-sm-r text-grey-200 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <MemberIcon aria-hidden="true" className="size-5" />
                      명단 확인
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto max-w-72 rounded-sm border-0 bg-surface-2 px-5 py-3 backdrop-blur-md">
                    {voters.length === 0 ? (
                      <p className="typo-sm-r text-grey-200">
                        아직 투표한 멤버가 없어요
                      </p>
                    ) : (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                        {voters.map((voter) => (
                          <li
                            key={voter.bandMemberId}
                            className="typo-sm-r text-grey-50"
                          >
                            {voter.nickname}
                          </li>
                        ))}
                      </ul>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-col">
        <div className="flex items-center justify-end gap-3 px-5">
          <button
            type="button"
            aria-label="이전 날짜"
            disabled={page === 0}
            onClick={() => setPageIndex(page - 1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-primary disabled:text-grey-400"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
          <p className="flex items-center gap-1 typo-sm-r whitespace-nowrap">
            <span className="text-grey-50">{page + 1}</span>
            <span className="text-grey-200">/</span>
            <span className="text-grey-200">{Math.max(pages.length, 1)}</span>
          </p>
          <button
            type="button"
            aria-label="다음 날짜"
            disabled={page >= pages.length - 1}
            onClick={() => setPageIndex(page + 1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-primary disabled:text-grey-400"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6" />
          </button>
        </div>

        <div className="px-5">
          {pages.length > 0 &&
            (isEditing ? (
              <SchedulePollGrid
                mode="edit"
                dateKeys={pages[page]}
                timeKeys={grid.timeKeys}
                cells={grid.cells}
                selectedIds={draftOptionIds}
                onToggle={handleToggleOption}
              />
            ) : (
              <SchedulePollGrid
                mode="result"
                dateKeys={pages[page]}
                timeKeys={grid.timeKeys}
                cells={grid.cells}
                maxCount={maxVoteCount(poll.options)}
              />
            ))}
        </div>
      </div>

      {/* 하단 고정 CTA. 헤더와 같은 방식(fixed + max-w)으로 앱 셸 폭에 맞춘다. 마감 후에는 숨긴다.
          네비 높이는 RootLayout이 --bottom-nav-clearance로 알려준다(직접 상수를 복제하지 않는다). */}
      {!isClosed && (
        <div
          className={cn(
            'fixed bottom-[var(--bottom-nav-clearance,0px)] z-40 w-full max-w-[648px] p-5',
            'bg-gradient-bottom/60 shadow-[0px_-4px_40px_0px_rgba(255,255,255,0.1)] backdrop-blur-sm',
          )}
        >
          <Button
            type="button"
            variant="shining"
            size="lg"
            className="w-full"
            isLoading={updateVote.isPending}
            onClick={isEditing ? submitVote : startEditing}
          >
            {ctaLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
