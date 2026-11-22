import { useAssistantConversation } from '../model/assistant-conversation';
import { QuestionForm } from './QuestionForm';

interface AssistantPanelProps {
  bandId: string;
}

/**
 * 밴드 홈의 물어보기 카드.
 *
 * 홈에서 질문을 입력하면 대화 화면이 아래에서 올라온다.
 * 대화 화면과 상태는 앱 전체에서 하나라(AssistantDock), 여기서는 질문을 보내기만 한다.
 * 홈에서 묻는 건 보통 새 주제라 항상 새 대화로 시작한다. 이어가기는 이어서 보기 바와 헤더 아이콘이 맡는다.
 */
export const AssistantPanel = ({ bandId }: AssistantPanelProps) => {
  const { draft, setDraft, pending, submitDraft } = useAssistantConversation();

  return (
    <section aria-label="밴드에 대해 물어보기" className="flex flex-col gap-3">
      <h2 className="typo-base-sb text-grey-100">밴드에 대해 물어보기</h2>
      <QuestionForm
        inputId="assistant-home-question"
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => submitDraft(bandId, true)}
        disabled={pending}
        alwaysShowSubmit={false}
      />
    </section>
  );
};
