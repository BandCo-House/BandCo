import CheckIcon from '@/assets/icons/check.svg?react';
import { useBandSettingsSaveAction } from '../model/save-action-store';

/**
 * 밴드 설정 헤더 우측 `저장`. 저장할 변경이 없으면 비활성이라,
 * 색이 아니라 disabled 상태로도 저장 가능 여부가 전달된다.
 */
export const BandSettingsSaveAction = () => {
  const action = useBandSettingsSaveAction();
  if (!action) return null;

  return (
    <button
      type="button"
      disabled={!action.canSave || action.isSaving}
      onClick={action.save}
      className="flex items-center gap-2.5 rounded-3xl px-3 py-2 typo-sm-m text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-grey-400"
    >
      {action.isSaving ? '저장 중...' : '저장'}
      <CheckIcon aria-hidden="true" className="size-4" />
    </button>
  );
};
