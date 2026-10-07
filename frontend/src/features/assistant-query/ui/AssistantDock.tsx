import { useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAssistantPresets } from '@/entities/assistant/api/useAssistant';
import { closeButtonClass } from '@/shared/ui/close-button';
import { GlassSurface } from '@/shared/ui/glass-surface';
import {
  useAssistantConversation,
  type AssistantConversation,
} from '../model/assistant-conversation';
import { AssistantScreen } from './AssistantScreen';
import { AssistantTurn } from './AssistantTurn';
import { QuestionForm } from './QuestionForm';
import { SuggestionList } from './SuggestionList';

interface AssistantDockProps {
  /** 지금 보고 있는 밴드. 밴드 밖이면 비어 있다. */
  currentBandId?: string;
  /** 경로가 바뀌면(뒤로 가기 등) 대화 화면을 내린다. */
  pathname: string;
}

/**
 * 물어보기 대화 화면과 이어서 보기 바. 앱 레이아웃에 한 번만 둔다.
 *
 * 대화 화면을 닫아도 대화가 남아 있으면, 같은 밴드 안 어느 페이지에서든 하단에 이어서 보기 바가 떠
 * 다른 페이지를 보다가 바로 돌아올 수 있다.
 */
export const AssistantDock = ({
  currentBandId,
  pathname,
}: AssistantDockProps) => {
  const {
    conversation,
    open,
    draft,
    setDraft,
    pending,
    submitDraft,
    openScreen,
    closeScreen,
    startNew,
    end,
  } = useAssistantConversation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 화면이 열린 채 뒤로 가기로 페이지가 바뀌면, 바뀐 페이지 위에 대화 화면이 남지 않게 내린다.
  useEffect(() => {
    closeScreen();
  }, [pathname, closeScreen]);

  if (conversation === null) return null;
  const { bandId, turns } = conversation;
  const showResume =
    !open && turns.length > 0 && currentBandId === conversation.bandId;

  return (
    <>
      <AssistantScreen
        open={open}
        onOpenChange={(next) => {
          if (!next) closeScreen();
        }}
        scrollRef={scrollRef}
        onStartNew={turns.length > 0 ? startNew : undefined}
        footer={
          <QuestionForm
            inputId="assistant-screen-question"
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={() => submitDraft(bandId)}
            disabled={pending}
            alwaysShowSubmit
          />
        }
      >
        <ConversationBody conversation={conversation} />
      </AssistantScreen>
      {showResume && (
        <ResumeBar
          label={turns[turns.length - 1].label}
          pending={pending}
          onOpen={() => openScreen(bandId)}
          onEnd={end}
        />
      )}
    </>
  );
};

/** 대화 화면 안쪽. 화면이 열려 있을 때만 그려져 추천 질문도 그때 불러온다. */
const ConversationBody = ({
  conversation,
}: {
  conversation: AssistantConversation;
}) => {
  const { ask, retry } = useAssistantConversation();
  const { data: presets = [] } = useAssistantPresets();
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const { bandId, turns } = conversation;

  // 새 질문이 생기면 그 질문이 화면 위쪽에 오게 부드럽게 옮긴다. 긴 답의 끝으로 튀지 않는다.
  useEffect(() => {
    latestTurnRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
  }, [turns.length]);

  const askPreset = (preset: (typeof presets)[number]) =>
    ask(
      bandId,
      { presetId: preset.id },
      preset.question,
      preset.followUps ?? [],
    );

  if (turns.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="typo-base-sb text-grey-50">
          밴드 일정, 참석, 곡, 팀 정보를 물어보세요.
        </p>
        {presets.length > 0 && (
          <SuggestionList
            title="이런 질문은 바로 답할 수 있어요"
            items={presets.map((preset) => ({
              key: preset.id,
              label: preset.question,
              onSelect: () => askPreset(preset),
            }))}
          />
        )}
      </div>
    );
  }

  return turns.map((turn, index) => {
    const isLatest = index === turns.length - 1;
    return (
      <div
        key={turn.id}
        ref={isLatest ? latestTurnRef : undefined}
        className="scroll-mt-4"
      >
        <AssistantTurn
          turn={turn}
          isLatest={isLatest}
          presets={presets}
          onFollowUp={(question) =>
            ask(
              bandId,
              { question },
              question,
              turn.followUps.filter((followUp) => followUp !== question),
            )
          }
          onAskPreset={askPreset}
          onAskCandidate={(question) => ask(bandId, { question }, question, [])}
          onRetry={() => retry(turn)}
        />
      </div>
    );
  });
};

interface ResumeBarProps {
  label: string;
  pending: boolean;
  onOpen: () => void;
  onEnd: () => void;
}

/**
 * 하단 탭바 바로 위에 뜨는 이어서 보기 바. 떠 있는 면이라 공용 유리 표면을 쓴다.
 * 밴드 홈의 + 버튼(우측 하단)과 겹치지 않게 왼쪽에 붙이고 오른쪽은 그 자리만큼 비운다.
 */
const ResumeBar = ({ label, pending, onOpen, onEnd }: ResumeBarProps) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-clearance,0px)_+_0.75rem)] z-40 mx-auto flex w-full max-w-[648px] justify-start pr-24 pl-5">
    <GlassSurface className="pointer-events-auto max-w-full animate-in rounded-full duration-300 fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <div className="flex items-center gap-3 py-1 pr-4 pl-1">
        <button
          type="button"
          onClick={onOpen}
          aria-label="물어보기 대화 이어서 보기"
          className="flex min-w-0 items-center gap-2 rounded-full py-2.5 pl-3"
        >
          <Sparkles
            aria-hidden="true"
            className="size-5 shrink-0 text-primary"
          />
          {/* 질문만 두면 누르면 그 질문을 묻는 추천 칩처럼 읽혀, 무엇을 하는 바인지 앞에 고정으로 둔다. */}
          <span className="shrink-0 typo-sm-sb text-grey-50">이어서 보기</span>
          <span className="truncate typo-xs-r text-grey-300">
            {pending ? '답을 찾고 있어요' : label}
          </span>
        </button>
        <button
          type="button"
          onClick={onEnd}
          aria-label="대화 끝내기"
          className={closeButtonClass}
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </GlassSurface>
  </div>
);
