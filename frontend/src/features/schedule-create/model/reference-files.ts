import { uploadFile } from '@/shared/api/upload';
import type {
  ScheduleReferenceFile,
  ScheduleReferenceFileInput,
} from '@/entities/schedule/model/types';

/** presigned 업로드 시 참고자료 파일이 저장되는 폴더. */
const REFERENCE_FILE_FOLDER = 'schedule-references';

/**
 * 폼이 들고 있는 참고자료 한 항목.
 * - `uploaded`: 이미 서버에 있는 파일(수정 진입 시 상세에서 온 것). 그대로 다시 보낸다.
 * - `local`: 사용자가 방금 고른 파일. 제출 시점에 업로드해 objectUrl을 얻는다.
 *
 * 고른 즉시 올리지 않는 이유: 추가만 하고 저장하지 않을 수 있어, 취소하면 버려질
 * 파일을 미리 스토리지에 남기게 된다. 업로드는 실제 제출 때 한 번만 한다.
 */
export type ReferenceFileDraft =
  | { kind: 'uploaded'; fileUrl: string; fileName: string }
  | { kind: 'local'; file: File };

/** 목록에서 같은 파일이 두 번 쌓이지 않도록 하는 키. */
export const referenceFileDraftKey = (draft: ReferenceFileDraft): string =>
  draft.kind === 'uploaded'
    ? `uploaded:${draft.fileUrl}`
    : `local:${draft.file.name}-${draft.file.size}-${draft.file.lastModified}`;

/** 화면에 보여줄 파일명. */
export const referenceFileDraftName = (draft: ReferenceFileDraft): string =>
  draft.kind === 'uploaded' ? draft.fileName : draft.file.name;

/** 상세(수정 진입)의 참고자료 → 이미 올라간 draft. */
export const toUploadedDraft = (
  file: ScheduleReferenceFile,
): ReferenceFileDraft => ({
  kind: 'uploaded',
  fileUrl: file.fileUrl,
  fileName: file.fileName,
});

/**
 * draft 목록을 요청 페이로드(`{ fileUrl, fileName }[]`)로 바꾼다.
 * `local`은 presigned 흐름으로 업로드해 objectUrl을 얻고, `uploaded`는 그대로 통과시킨다.
 * 선택 순서를 유지하기 위해 병렬 업로드 후 원래 순서대로 매핑한다.
 */
export const resolveReferenceFiles = async (
  drafts: ReferenceFileDraft[],
): Promise<ScheduleReferenceFileInput[]> =>
  Promise.all(
    drafts.map(async (draft) => {
      if (draft.kind === 'uploaded') {
        return { fileUrl: draft.fileUrl, fileName: draft.fileName };
      }
      const fileUrl = await uploadFile(draft.file, REFERENCE_FILE_FOLDER);
      return { fileUrl, fileName: draft.file.name };
    }),
  );
