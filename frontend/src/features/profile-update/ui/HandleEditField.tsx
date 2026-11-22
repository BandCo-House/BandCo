import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { formatClockTime } from '@/shared/lib/date';
import type { HandleCheckStatus, HandleField } from '../model/useHandleField';

interface HandleEditFieldProps {
  field: HandleField;
  /** 다음 변경 가능 시각. 값이 있으면 7일 제한 중이라 입력을 잠근다. */
  changeableAt: string | null;
  autoFocus?: boolean;
}

const STATUS_ID = 'handle-input-status';
const RULES_ID = 'handle-input-rules';

const STATUS_MESSAGES: Partial<Record<HandleCheckStatus, string>> = {
  checking: '확인하는 중이에요.',
  available: '사용할 수 있는 고유 ID예요.',
};

const formatChangeableAt = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${formatClockTime(iso)}`;
};

/**
 * 바꾸기 전에 알아야 할 규칙. 저장한 뒤 7일간 되돌릴 수 없어서 누르기 전에 보여준다.
 * 처음 정하는 값은 한 번 바로 고칠 수 있다(백엔드 결정 6).
 */
const getChangeRule = (
  isFirstSet: boolean,
  changeableAt: string | null,
): string => {
  if (changeableAt) {
    return `${formatChangeableAt(changeableAt)} 이후에 다시 바꿀 수 있어요.`;
  }
  if (isFirstSet) {
    return '처음 정한 ID는 한 번 바로 고칠 수 있고, 그다음부터는 7일에 한 번 바꿀 수 있어요.';
  }
  return '바꾸면 7일 동안 다시 바꿀 수 없어요.';
};

/**
 * 프로필 편집 카드의 고유 ID 행. 라벨·입력은 카드의 2열 그리드에 들어가고,
 * 규칙 안내는 두 칸을 다 써서 아래에 깐다 — 입력 칸 폭에 넣으면 문장이 줄마다 끊긴다.
 * 중복 확인은 입력이 멈추면 자동으로 돈다(`useHandleField`).
 */
export const HandleEditField = ({
  field,
  changeableAt,
  autoFocus = false,
}: HandleEditFieldProps) => {
  const isLocked = changeableAt !== null;
  const statusMessage = isLocked
    ? null
    : (field.error ?? STATUS_MESSAGES[field.status] ?? null);

  return (
    <>
      <label
        htmlFor="handle-input"
        className="shrink-0 cursor-pointer typo-sm-b text-grey-50"
      >
        고유 ID
      </label>
      <div className="flex min-w-0 flex-col gap-1">
        <Input
          id="handle-input"
          value={field.value}
          onChange={(e) => field.change(e.target.value)}
          disabled={isLocked}
          autoFocus={autoFocus}
          placeholder="영문·숫자·_ 4~8자"
          aria-invalid={!!field.error}
          aria-describedby={cn(statusMessage && STATUS_ID, RULES_ID)}
          className="w-full rounded-none border-0 bg-transparent p-0 typo-base-sb caret-primary shadow-none outline-none focus:ring-0 focus-visible:ring-0 disabled:text-grey-200"
        />
        {statusMessage && (
          <p
            id={STATUS_ID}
            role="status"
            className={cn(
              'typo-sm-sb',
              field.error ? 'text-destructive' : 'text-grey-50',
            )}
          >
            {statusMessage}
          </p>
        )}
      </div>
      <p id={RULES_ID} className="col-span-2 typo-sm-r text-grey-50">
        {getChangeRule(field.isFirstSet, changeableAt)}
      </p>
    </>
  );
};
