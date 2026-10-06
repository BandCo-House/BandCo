import {
  AppDialogBody,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** 되돌리기 어려운 동작 전 한 번 확인받는 모달. 앱의 다른 모달과 같은 glass 스타일을 쓴다. */
export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </AppDialogHeader>
        {description ? (
          <AppDialogBody>
            <DialogDescription className="typo-sm-r text-grey-200">
              {description}
            </DialogDescription>
          </AppDialogBody>
        ) : null}
        {/* DialogFooter 기본값이 모바일 폭에서 flex-col-reverse라 버튼이 세로로 쌓인다. */}
        <AppDialogFooter className="flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="pill"
            className="border-grey-50 typo-base-b text-grey-50"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="shining"
            size="pill"
            className="typo-base-sb"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  );
};
