import { useEffect, useState } from 'react';
import { HANDLE_PATTERN, handleSchema } from '@/entities/user/model/schema';
import { getApiErrorMessage } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { checkHandleAvailability } from '../api/handle-api';

export type HandleCheckStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'invalid'
  | 'error';

type CheckResult =
  | { value: string; available: boolean }
  | { value: string; error: string };

const CHECK_DELAY_MS = 400;
const HANDLE_TAKEN_MESSAGE = '이미 사용 중인 고유 ID예요.';

/**
 * 프로필 편집의 고유 ID 입력 상태. 입력이 멈추면 중복 확인(#71)을 알아서 돌리고,
 * 바꾼 값은 사용 가능으로 확인돼야 저장할 수 있다.
 * 프로필이 늦게 도착하므로 편집을 시작할 때 `reset`으로 현재 값을 다시 채운다.
 */
export const useHandleField = (currentHandle: string | null) => {
  const current = currentHandle ?? '';
  const [value, setValue] = useState(current);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const debouncedValue = useDebouncedValue(value, CHECK_DELAY_MS);

  useEffect(() => {
    if (debouncedValue === current || !HANDLE_PATTERN.test(debouncedValue)) {
      return;
    }
    // 응답이 오기 전에 입력이 또 바뀌면 이 응답은 옛 값에 대한 것이라 버린다.
    let ignore = false;
    checkHandleAvailability(debouncedValue)
      .then(({ available }) => {
        if (!ignore) setCheckResult({ value: debouncedValue, available });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setCheckResult({
          value: debouncedValue,
          error: getApiErrorMessage(
            err,
            '고유 ID를 확인하지 못했어요. 다시 입력해 주세요.',
          ),
        });
      });
    return () => {
      ignore = true;
    };
  }, [debouncedValue, current]);

  const isChanged = value !== current;
  const parsed = handleSchema.safeParse(value);
  // 타이핑 중에는 판정하지 않는다 — 글자마다 "형식 오류"가 깜빡이면 입력을 방해한다.
  const status: HandleCheckStatus =
    !isChanged || value !== debouncedValue
      ? 'idle'
      : !parsed.success
        ? 'invalid'
        : checkResult?.value !== value
          ? 'checking'
          : 'error' in checkResult
            ? 'error'
            : checkResult.available
              ? 'available'
              : 'taken';

  const error =
    status === 'invalid'
      ? (parsed.error?.issues[0]?.message ?? null)
      : status === 'taken'
        ? HANDLE_TAKEN_MESSAGE
        : status === 'error' && checkResult && 'error' in checkResult
          ? checkResult.error
          : null;

  /** 지금 저장하면 안 되는 이유. 저장해도 되면 null */
  const saveBlockReason: string | null =
    !isChanged || status === 'available'
      ? null
      : (error ?? '고유 ID를 확인하고 있어요. 잠시 후 다시 저장해 주세요.');

  return {
    value,
    status,
    error,
    isChanged,
    /** 아직 고유 ID가 없다. 처음 정하는 값은 7일 제한에 세지 않는다. */
    isFirstSet: currentHandle === null,
    saveBlockReason,
    change: setValue,
    reset: () => setValue(current),
  };
};

export type HandleField = ReturnType<typeof useHandleField>;
