import { useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Textarea } from '@/shared/ui/textarea';
import {
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  type ReportReason,
} from '../model/report';
import { useCreateUserReport } from '../model/useCreateUserReport';

interface UserReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
}

const REPORT_SUCCESS_MESSAGE = '신고가 접수되었습니다.';
const REPORT_FAILED_MESSAGE =
  '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.';
const DESCRIPTION_ID = 'user-report-description';
const DESCRIPTION_COUNT_ID = 'user-report-description-count';

/**
 * 유저 신고 모달. 사유(필수)를 하나 고르고 상세 내용(선택)을 적어 접수한다.
 * 409(이미 처리 대기 중인 신고)·400(본인)·404(대상 없음)는 서버 메시지를 그대로 보여준다.
 */
export const UserReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
}: UserReportDialogProps) => {
  const { mutate, isPending } = useCreateUserReport(reportedUserId);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setReason(null);
      setDescription('');
    }
  }

  const canSubmit = reason !== null && !isPending;

  const handleSubmit = () => {
    if (!reason || isPending) return;
    const trimmedDescription = description.trim();
    mutate(
      { reason, description: trimmedDescription || undefined },
      {
        onSuccess: () => {
          toast.success(REPORT_SUCCESS_MESSAGE);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, REPORT_FAILED_MESSAGE));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent size="full" className="gap-10 text-grey-50">
        <AppDialogHeader className="mb-0">
          <DialogTitle>신고하기</DialogTitle>
          <AppDialogClose aria-label="신고하기 닫기" />
        </AppDialogHeader>

        <AppDialogBody className="gap-9">
          <DialogDescription className="typo-sm-r break-words text-grey-200">
            {reportedUserName}님을 신고하는 이유를 골라주세요. 접수된 신고는
            운영팀이 확인해요.
          </DialogDescription>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2">
              <FieldLabel required size="lg">
                신고 사유
              </FieldLabel>
            </legend>
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map((value) => (
                <label
                  key={value}
                  className="cursor-pointer rounded-full border border-grey-400 px-4 py-2 typo-sm-sb text-grey-100 transition-colors has-checked:border-primary has-checked:bg-primary has-checked:text-primary-dark has-focus-visible:ring-2 has-focus-visible:ring-primary"
                >
                  <input
                    type="radio"
                    name="user-report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="sr-only"
                  />
                  {REPORT_REASON_LABELS[value]}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="상세 내용" labelSize="lg" htmlFor={DESCRIPTION_ID}>
            <Textarea
              id={DESCRIPTION_ID}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="어떤 일이 있었는지 알려주시면 확인에 도움이 돼요"
              maxLength={REPORT_DESCRIPTION_MAX_LENGTH}
              aria-describedby={DESCRIPTION_COUNT_ID}
              className="min-h-[140px]"
            />
            <p
              id={DESCRIPTION_COUNT_ID}
              className="self-end typo-xs-r text-grey-300"
            >
              {description.length}/{REPORT_DESCRIPTION_MAX_LENGTH}
            </p>
          </Field>
        </AppDialogBody>

        {/* 버튼은 스크롤 본문 밖에 둔다: 본문 overflow가 shining 글로우를 자르지 않도록. */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="shining"
            size="lg"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={handleSubmit}
          >
            신고하기
          </Button>
        </div>
      </AppDialogContent>
    </Dialog>
  );
};
