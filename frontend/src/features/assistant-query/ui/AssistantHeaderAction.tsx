import { Sparkles } from 'lucide-react';
import { useAssistantConversation } from '../model/assistant-conversation';

interface AssistantHeaderActionProps {
  bandId: string;
}

/** 밴드 헤더에서 물어보기 대화 화면을 여는 아이콘. 이어지던 대화가 있으면 그대로 연다. */
export const AssistantHeaderAction = ({
  bandId,
}: AssistantHeaderActionProps) => {
  const { openScreen } = useAssistantConversation();
  return (
    <button
      type="button"
      onClick={() => openScreen(bandId)}
      aria-label="밴드에 물어보기"
      className="inline-flex size-10 items-center justify-center rounded-full text-grey-100"
    >
      <Sparkles aria-hidden="true" className="size-6" />
    </button>
  );
};
