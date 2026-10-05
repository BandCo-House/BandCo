import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { isoToKstInput, kstInputToIso } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Checkbox, Field, Input, Textarea } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';

import {
  ANNOUNCEMENT_CONTENT_MAX_LENGTH,
  ANNOUNCEMENT_TITLE_MAX_LENGTH,
  useCreateAnnouncement,
  useUpdateAnnouncement,
} from '../api';
import type { Announcement } from '../types';

const FORM_ID = 'announcement-form';

interface AnnouncementFormModalProps {
  /** 없으면 새 공지 작성 */
  announcement: Announcement | null;
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트해 초기값을 announcement에서 가져온다. */
export const AnnouncementFormModal = ({
  announcement,
  onClose,
}: AnnouncementFormModalProps) => {
  const isEdit = announcement !== null;
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [content, setContent] = useState(announcement?.content ?? '');
  const [isPublished, setIsPublished] = useState(
    announcement?.isPublished ?? false,
  );
  const [startsAt, setStartsAt] = useState(
    isoToKstInput(announcement?.startsAt),
  );
  const [endsAt, setEndsAt] = useState(isoToKstInput(announcement?.endsAt));

  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const isSaving = createAnnouncement.isPending || updateAnnouncement.isPending;

  // 같은 형식(YYYY-MM-DDTHH:mm)이라 문자열 비교로 순서를 판단할 수 있다.
  const invalidRange = Boolean(startsAt && endsAt && startsAt >= endsAt);
  const canSubmit =
    title.trim().length > 0 && content.trim().length > 0 && !invalidRange;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const startsAtIso = kstInputToIso(startsAt);
    const endsAtIso = kstInputToIso(endsAt);
    const onSuccess = () => {
      toast.success(isEdit ? '공지를 수정했습니다.' : '공지를 등록했습니다.');
      onClose();
    };

    if (announcement) {
      updateAnnouncement.mutate(
        {
          announcementId: announcement.announcementId,
          body: {
            title: title.trim(),
            content: content.trim(),
            isPublished,
            // 비운 기간은 null로 보내 해제한다.
            startsAt: startsAtIso,
            endsAt: endsAtIso,
          },
        },
        { onSuccess },
      );
      return;
    }

    createAnnouncement.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        isPublished,
        ...(startsAtIso ? { startsAt: startsAtIso } : {}),
        ...(endsAtIso ? { endsAt: endsAtIso } : {}),
      },
      { onSuccess },
    );
  };

  return (
    <Modal
      open
      title={isEdit ? '공지 수정' : '새 공지'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={!canSubmit}
            loading={isSaving}
          >
            저장
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Field label="제목">
          <Input
            value={title}
            maxLength={ANNOUNCEMENT_TITLE_MAX_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
        <Field
          label="내용"
          hint={`${content.length} / ${ANNOUNCEMENT_CONTENT_MAX_LENGTH}자`}
        >
          <Textarea
            rows={8}
            value={content}
            maxLength={ANNOUNCEMENT_CONTENT_MAX_LENGTH}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="게시 시작 (KST, 선택)" hint="비우면 즉시 노출">
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </Field>
          <Field
            label="게시 종료 (KST, 선택)"
            hint={
              invalidRange ? (
                <span className="text-red-600">
                  종료 시각은 시작 시각보다 뒤여야 합니다.
                </span>
              ) : (
                '비우면 계속 노출'
              )
            }
          >
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </Field>
        </div>
        <Checkbox
          label="게시 (체크하지 않으면 비공개로 저장)"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
        />
      </form>
    </Modal>
  );
};
