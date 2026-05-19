import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { useInviteAccept } from '@/features/invite-accept/model/useInviteAccept';

type InviteCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const InviteCodeDialog = ({
  open,
  onOpenChange,
}: InviteCodeDialogProps) => {
  const { code, setCode, submit, isLoading, isDisabled, error } =
    useInviteAccept({
      onSuccess: () => onOpenChange(false),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>초대 코드 입력</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="초대 코드를 입력하세요"
          />
          {error ? (
            <p className="typo-sm-r text-destructive">{error}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={isDisabled}
            isLoading={isLoading}
            loadingContent="처리 중..."
            onClick={submit}
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
