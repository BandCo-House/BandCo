import { Button } from '@/shared/ui/button';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogFooter,
  AppDialogHeader,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { useInviteAccept } from '@/features/invite-accept/model/useInviteAccept';
import { cn } from '@/shared/lib/utils';

type InviteCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const InviteCodeDialog = ({
  open,
  onOpenChange,
}: InviteCodeDialogProps) => {
  const { code, setCode, reset, submit, isLoading, isDisabled } =
    useInviteAccept({
      onSuccess: () => onOpenChange(false),
    });

  // 닫을 때 입력을 비운다. 안 비우면 틀린 코드가 남아 다음에 열 때 그대로 보인다.
  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AppDialogContent>
        <AppDialogHeader>
          <DialogTitle>초대코드 입력</DialogTitle>
          <AppDialogClose />
        </AppDialogHeader>
        <DialogDescription className="sr-only">
          전달받은 초대코드를 입력해 밴드에 참여합니다.
        </DialogDescription>
        <AppDialogBody>
          <label htmlFor="invite-code" className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <span className="typo-lg-sb">초대코드</span>
              <div className="h-1 w-1 rounded-full bg-destructive"></div>
            </div>
            <Input
              id="invite-code"
              variant="underline"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="초대 코드를 입력하세요"
              className="border-grey-200/80 placeholder:text-grey-200 hover:border-grey-100 focus-visible:border-grey-100"
            />
          </label>
        </AppDialogBody>

        <AppDialogFooter>
          <Button
            type="button"
            size="lg"
            className={cn(
              'w-fit text-base',
              isDisabled && 'border border-white bg-white/60',
            )}
            variant={'shining'}
            disabled={isDisabled}
            isLoading={isLoading}
            loadingContent="처리 중..."
            onClick={submit}
          >
            확인
          </Button>
        </AppDialogFooter>
      </AppDialogContent>
    </Dialog>
  );
};
