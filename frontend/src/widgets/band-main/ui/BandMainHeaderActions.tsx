import { useParams } from '@tanstack/react-router';
import { AssistantHeaderAction } from '@/features/assistant-query';
import { BandSettingsAction } from './BandSettingsAction';

/** 밴드 메인 헤더 우측. 물어보기 아이콘과 설정 아이콘을 나란히 둔다. */
export const BandMainHeaderActions = () => {
  const { bandId } = useParams({ from: '/band/$bandId' });
  return (
    <>
      <AssistantHeaderAction bandId={bandId} />
      <BandSettingsAction />
    </>
  );
};
