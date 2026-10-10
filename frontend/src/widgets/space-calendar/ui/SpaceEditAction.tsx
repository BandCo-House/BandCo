import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import SettingIcon from '@/assets/icons/setting.svg?react';
import { useSpace } from '@/entities/space/api/useSpace';
import { SpaceCreateModal } from '@/features/space-create/ui/SpaceCreateModal';

/**
 * 합주 공간 메인 앱바 우측의 설정 아이콘. 누르면 생성과 같은 모달이 수정 모드로 열린다.
 * 상세를 아직 못 받았으면 채울 값이 없으므로 아이콘을 그리지 않는다.
 */
export const SpaceEditAction = () => {
  const { bandId = '', spaceId = '' } = useParams({ strict: false });
  const [isOpen, setIsOpen] = useState(false);
  const { data: spaceDetail } = useSpace(spaceId);

  if (!spaceDetail) return null;

  return (
    <>
      <button
        type="button"
        aria-label="합주 공간 수정"
        onClick={() => setIsOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-full text-grey-100 focus-visible:outline-2 focus-visible:outline-key"
      >
        <SettingIcon aria-hidden="true" className="size-6" />
      </button>
      <SpaceCreateModal
        open={isOpen}
        onOpenChange={setIsOpen}
        bandId={bandId}
        editTarget={spaceDetail}
      />
    </>
  );
};
