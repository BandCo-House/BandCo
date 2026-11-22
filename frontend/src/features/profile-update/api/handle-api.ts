import { z } from 'zod';
import { apiGet, apiPatch } from '@/shared/api';

const handleAvailabilitySchema = z.object({
  handle: z.string(),
  available: z.boolean(),
});

const changeHandleResultSchema = z.object({
  userId: z.string(),
  handle: z.string(),
  handleChangedAt: z.string().nullable(),
  /** 처음 설정 직후는 바로 한 번 더 바꿀 수 있어 null이다. */
  handleChangeableAt: z.string().nullable(),
});

export type HandleAvailability = z.infer<typeof handleAvailabilitySchema>;
export type ChangeHandleResult = z.infer<typeof changeHandleResultSchema>;

/**
 * 고유 ID 중복 확인(#71). 로그인이 필요하고, 본인이 지금 쓰는 값은 사용 가능으로 온다.
 */
export const checkHandleAvailability = (
  handle: string,
): Promise<HandleAvailability> =>
  apiGet<unknown>('/users/handles/availability', { params: { handle } }).then(
    (result) => handleAvailabilitySchema.parse(result),
  );

/**
 * 고유 ID 변경(#72). 본인만 가능하고, 처음 설정을 뺀 변경은 7일에 한 번이다.
 * 중복·형식·7일 제한은 400으로 오며 사용자 메시지는 `getApiErrorMessage`로 읽는다.
 */
export const changeHandle = (
  userId: string,
  handle: string,
): Promise<ChangeHandleResult> =>
  apiPatch<unknown>(`/users/${encodeURIComponent(userId)}/handle`, {
    handle,
  }).then((result) => changeHandleResultSchema.parse(result));
