import { useState } from 'react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { TypeSelectStep } from './steps/TypeSelectStep';
import { PracticeBasicStep } from './steps/PracticeBasicStep';
import { SongSelectStep } from './steps/SongSelectStep';
import { TeamSelectStep } from './steps/TeamSelectStep';
import { MeetingBasicStep } from './steps/MeetingBasicStep';
import { MemberSelectStep } from './steps/MemberSelectStep';
import { useCreateSchedule } from '../api/useCreateSchedule';
import type { ScheduleType } from '@/entities/schedule/model/types';
import type { ScheduleCreateFormState } from '../model/types';

interface ScheduleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export const ScheduleCreateModal = ({
  isOpen,
  onClose,
  initialDate,
}: ScheduleCreateModalProps) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 통합 폼 상태
  const [formData, setFormData] = useState<ScheduleCreateFormState>({
    title: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
    startTime: '19:00',
    endTime: '21:00',
    placeId: null,
    songId: null,
    teamId: null,
    participantUserIds: [],
    memo: '',
  });

  const handleTypeSelect = (type: ScheduleType) => {
    setScheduleType(type);
    setCurrentStep(1);
  };

  const updateForm = (updates: Partial<ScheduleCreateFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const { mutateAsync: createSchedule, isPending } = useCreateSchedule();

  const handleSubmit = async () => {
    if (isPending) return;
    if (!scheduleType) return;

    try {
      const startAt = `${formData.date}T${formData.startTime}:00Z`;
      const endAt = `${formData.date}T${formData.endTime}:00Z`;

      if (scheduleType === 'PRACTICE') {
        if (!formData.songId || !formData.teamId || !formData.placeId) return;

        // PRACTICE 제목 자동 생성 (실제 구현 시 선택된 곡/팀 정보가 필요하지만 현재는 ID만 있음)
        // TODO: 곡/팀 정보를 가져와서 제목 구성하는 로직 보완 필요
        const generatedTitle = `합주 연습 (${formData.date})`;

        await createSchedule({
          title: generatedTitle,
          scheduleType: 'PRACTICE',
          startAt,
          endAt,
          placeId: formData.placeId,
          songId: formData.songId,
          teamId: formData.teamId,
          status: 'SCHEDULED',
        });
      } else if (scheduleType === 'MEETING') {
        await createSchedule({
          title: formData.title,
          scheduleType: 'MEETING',
          startAt,
          endAt,
          participantUserIds: formData.participantUserIds,
          memo: formData.memo,
          status: 'SCHEDULED',
        });
      }
      
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const renderStep = () => {
    if (currentStep === 0) {
      return <TypeSelectStep onSelect={handleTypeSelect} />;
    }

    if (scheduleType === 'PRACTICE') {
      switch (currentStep) {
        case 1:
          return (
            <PracticeBasicStep
              data={formData}
              onChange={updateForm}
              onNext={handleNextStep}
            />
          );
        case 2:
          return (
            <SongSelectStep
              selectedId={formData.songId}
              onChange={(songId) => updateForm({ songId })}
              onNext={handleNextStep}
            />
          );
        case 3:
          return (
            <TeamSelectStep
              selectedTeamId={formData.teamId}
              onChange={(teamId) => updateForm({ teamId })}
              onSubmit={handleSubmit}
            />
          );
        default:
          return null;
      }
    }

    if (scheduleType === 'MEETING') {
      switch (currentStep) {
        case 1:
          return (
            <MeetingBasicStep
              data={formData}
              onChange={updateForm}
              onNext={handleNextStep}
            />
          );
        case 2:
          return (
            <MemberSelectStep
              selectedIds={formData.participantUserIds}
              onChange={(participantUserIds) => updateForm({ participantUserIds })}
              memo={formData.memo}
              onMemoChange={(memo) => updateForm({ memo })}
              onSubmit={handleSubmit}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-800 tracking-tight">
            새 일정 추가
          </DialogTitle>
        </DialogHeader>
        <div className="px-8 pb-8">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
