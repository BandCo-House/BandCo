import { useEffect, useState, useMemo } from 'react';
import { createInvite } from '@/features/invite-create/api/invite-api';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { UserPlus } from 'lucide-react';
import { useMyBands } from '@/entities/band/api/useMyBands';

export interface BandInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteeName: string;
  inviteeUserId: string;
  isLoggedIn: boolean;
}

export function BandInviteModal({
  open,
  onOpenChange,
  inviteeName,
  inviteeUserId,
  isLoggedIn,
}: BandInviteModalProps) {
  const { data: bands = [], isLoading } = useMyBands(open && isLoggedIn);
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 백엔드는 BM·ADMIN에게만 초대 권한을 준다. 일반 멤버 밴드를 보여주면 전송 시 403만 난다.
  const availableBands = useMemo(
    () => bands.filter((b) => b.myRole === 'BM' || b.myRole === 'ADMIN'),
    [bands],
  );

  useEffect(() => {
    if (open && availableBands.length > 0) {
      // 목록이 갱신돼 기존 선택이 초대 가능 밴드에서 빠지면 첫 항목으로 되돌린다.
      setSelectedBandId((prev) =>
        prev && availableBands.some((b) => b.id === prev)
          ? prev
          : availableBands[0].id,
      );
    }
  }, [open, availableBands]);

  useEffect(() => {
    if (!open) {
      setSelectedBandId('');
    }
  }, [open]);

  const handleInvite = async () => {
    if (!selectedBandId) {
      toast.warning('초대할 밴드를 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createInvite(selectedBandId, { inviteeUserId });
      toast.success(`${inviteeName}님을 성공적으로 초대했습니다!`);
      onOpenChange(false);
    } catch {
      toast.error('초대 전송 도중 에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-md border-border bg-surface-1 text-grey-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            밴드 초대하기
          </DialogTitle>
          <DialogDescription className="typo-sm-r text-grey-300">
            {inviteeName}님을 회원님이 소속된 밴드로 정중히 초대합니다.
          </DialogDescription>
        </DialogHeader>

        {availableBands.length > 0 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="typo-sm-sb text-grey-200">
                초대할 내 밴드 선택
              </label>
              <select
                value={selectedBandId}
                onChange={(e) => setSelectedBandId(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-2 p-3 typo-sm-r text-grey-100 focus:border-primary focus:outline-none"
              >
                {availableBands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.myRole === 'BM' ? '마스터' : '부리더'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center typo-sm-r text-grey-300">
            {isLoading
              ? '밴드 목록을 불러오고 있습니다...'
              : '초대 권한이 있는 밴드가 없습니다. 초대는 밴드 마스터·부리더만 보낼 수 있어요.'}
          </div>
        )}

        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-border bg-surface-2 hover:bg-surface-1"
          >
            취소
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleInvite}
            disabled={availableBands.length === 0 || isSubmitting}
            className="bg-primary text-grey-600 hover:bg-primary/90"
          >
            초대 전송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
