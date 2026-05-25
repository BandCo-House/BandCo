import { useEffect, useState } from 'react';
import { getBands } from '@/entities/band/api/band-api';
import type { Band } from '@/entities/band/model/types';
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
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBandId, setSelectedBandId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Load bands when modal opens
  useEffect(() => {
    if (open) {
      const loadBands = async () => {
        try {
          setLoading(true);
          const data = await getBands();
          // Filter my role as BM or MEMBER
          const myBms = data.filter((b) => b.myRole === 'BM');
          const availableBands = myBms.length > 0 ? myBms : data;
          setBands(availableBands);

          if (availableBands.length > 0) {
            setSelectedBandId(availableBands[0].id);
          }
        } catch (e) {
          toast.error('밴드 목록을 불러오는 데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      loadBands();
    }
  }, [open]);

  const handleInvite = async () => {
    if (!selectedBandId) {
      toast.warning('초대할 밴드를 선택해주세요.');
      return;
    }

    if (!inviteeEmail) {
      toast.error('대상 유저의 이메일 정보가 누락되어 초대를 보낼 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      await createInvite(selectedBandId, { inviteeEmail });
      toast.success(`${inviteeName}님을 성공적으로 초대했습니다!`);
      onOpenChange(false);
    } catch (e) {
      toast.error('초대 전송 도중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="typo-xl-b text-white flex items-center gap-2">
            <UserPlus className="size-5 text-violet-400" />
            밴드 초대하기
          </DialogTitle>
          <DialogDescription className="typo-sm-r text-slate-400">
            {inviteeName}님을 회원님이 소속된 밴드로 정중히 초대합니다.
          </DialogDescription>
        </DialogHeader>

        {bands.length > 0 ? (
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="typo-sm-m text-slate-300">초대할 내 밴드 선택</label>
              <select
                value={selectedBandId}
                onChange={(e) => setSelectedBandId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 typo-sm-r text-slate-200 focus:outline-none focus:border-violet-500"
              >
                {bands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.myRole === 'BM' ? '마스터' : '멤버'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center typo-sm-r text-slate-500">
            {loading ? '밴드 목록을 불러오고 있습니다...' : '초대할 수 있는 소속 밴드가 없습니다. 밴드를 먼저 생성해보세요!'}
          </div>
        )}

        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-slate-800 bg-slate-950 hover:bg-slate-850"
          >
            취소
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleInvite}
            disabled={bands.length === 0 || loading}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            초대 전송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
