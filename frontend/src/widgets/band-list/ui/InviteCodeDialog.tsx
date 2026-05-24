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
import { GlowBlob } from '@/shared/ui/glow-blob';

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
      <DialogContent
        className="overflow-hidden border border-white/20 bg-white/24"
        style={{ boxShadow: '0px 3px 6px 2px rgba(255,255,255,0.16)' }}
      >
        <DialogHeader>
          <DialogTitle>초대코드 입력</DialogTitle>
        </DialogHeader>
        <GlowBlob />
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
            className={`${code.length > 0 ? 'border-key' : ''}`}
          />
        </label>

        <DialogFooter>
          <Button
            type="button"
            className={`${isDisabled ? 'border border-white' : ''}`}
            variant={'shining'}
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
