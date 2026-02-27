import { useState } from 'react';

import { TypeSelectStep } from './steps/TypeSelectStep';
import { EnsembleBasicStep } from './steps/EnsembleBasicStep';
import { SongSelectStep } from './steps/SongSelectStep';
import { TeamSelectStep } from './steps/TeamSelectStep';
import { MeetingBasicStep } from './steps/MeetingBasicStep';
import { MemberSelectStep } from './steps/MemberSelectStep';
import { useCreateSchedule } from '../api/useCreateSchedule';
import type { ScheduleType } from '@/entities/schedule/model/types';
export const ScheduleCreateModal = () => {
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // 통합 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    songId: null as string | null,
    teamId: null as string | null,
    memberIds: [] as string[],
    memo: '',
  });

  const handleTypeSelect = (type: ScheduleType) => {
    setScheduleType(type);
    setCurrentStep(1);
  };

  const updateForm = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const { mutateAsync: createSchedule, isPending } = useCreateSchedule();

  const handleSubmit = async () => {
    if (isPending) return;
    if (scheduleType !== 'ensemble' && scheduleType !== 'meeting') return;

    try {
      if (scheduleType === 'ensemble') {
        if (!formData.songId || !formData.teamId) return;

        await createSchedule({
          type: 'ensemble',
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          place: formData.place,
          songId: formData.songId,
          teamId: formData.teamId,
        });
      } else {
        if (formData.memberIds.length === 0) return;

        await createSchedule({
          type: 'meeting',
          title: formData.title,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          memberIds: formData.memberIds,
          memo: formData.memo,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div data-testid="schedule-create-modal">
      <h1>새 일정 추가</h1>
      {currentStep === 0 && <TypeSelectStep onSelect={handleTypeSelect} />}
      {scheduleType === 'ensemble' && currentStep === 1 && (
        <EnsembleBasicStep
          data={formData}
          onChange={updateForm}
          onNext={handleNextStep}
        />
      )}
      {scheduleType === 'ensemble' && currentStep === 2 && (
        <SongSelectStep
          selectedId={formData.songId}
          onChange={(songId) => updateForm({ songId })}
          onNext={handleNextStep}
        />
      )}
      {scheduleType === 'ensemble' && currentStep === 3 && (
        <TeamSelectStep
          selectedTeamId={formData.teamId}
          onChange={(teamId) => updateForm({ teamId })}
          onSubmit={handleSubmit}
        />
      )}
      {scheduleType === 'meeting' && currentStep === 1 && (
        <MeetingBasicStep
          data={formData}
          onChange={updateForm}
          onNext={handleNextStep}
        />
      )}
      {scheduleType === 'meeting' && currentStep === 2 && (
        <MemberSelectStep
          selectedIds={formData.memberIds}
          onChange={(memberIds) => updateForm({ memberIds })}
          memo={formData.memo}
          onMemoChange={(memo) => updateForm({ memo })}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};
