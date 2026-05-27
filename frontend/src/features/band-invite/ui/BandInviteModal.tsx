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
  inviteeEmail: string | null;
}

export function BandInviteModal({
  open,
  onOpenChange,
  inviteeName,
  inviteeEmail,
}: BandInviteModalProps) {
  const { data: bands = [], isLoading } = useMyBands();
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBands = useMemo(() => {
    const myBms = bands.filter((b) => b.myRole === 'BM');
    return myBms.length > 0 ? myBms : bands;
  }, [bands]);

  useEffect(() => {
    if (open && availableBands.length > 0) {
      setSelectedBandId((prev) => prev || availableBands[0].id);
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

    if (!inviteeEmail) {
      toast.error(
        '대상 유저의 이메일 정보가 누락되어 초대를 보낼 수 없습니다.',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createInvite(selectedBandId, { inviteeEmail });
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
      <DialogContent className="max-w-sm rounded-2xl border-slate-800 bg-slate-900 text-slate-100">
        <DialogHeader>
          <DialogTitle className="typo-xl-b flex items-center gap-2 text-white">
            <UserPlus className="size-5 text-violet-400" />
            밴드 초대하기
          </DialogTitle>
          <DialogDescription className="typo-sm-r text-slate-400">
            {inviteeName}님을 회원님이 소속된 밴드로 정중히 초대합니다.
          </DialogDescription>
        </DialogHeader>

        {availableBands.length > 0 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="typo-sm-m text-slate-300">
                초대할 내 밴드 선택
              </label>
              <select
                value={selectedBandId}
                onChange={(e) => setSelectedBandId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 typo-sm-r text-slate-200 focus:border-violet-500 focus:outline-none"
              >
                {availableBands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.myRole === 'BM' ? '마스터' : '멤버'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center typo-sm-r text-slate-500">
            {isLoading
              ? '밴드 목록을 불러오고 있습니다...'
              : '초대할 수 있는 소속 밴드가 없습니다. 밴드를 먼저 생성해보세요!'}
          </div>
        )}

        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-850 border-slate-800 bg-slate-950"
          >
            취소
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleInvite}
            disabled={availableBands.length === 0 || isSubmitting}
            className="bg-violet-600 text-white hover:bg-violet-500"
          >
            초대 전송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
