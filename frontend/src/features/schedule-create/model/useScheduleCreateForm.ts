import { useState } from 'react';
import { useCreateSchedule } from '../api/useCreateSchedule';
import type { ScheduleType } from '@/entities/schedule/model/types';
import type { ScheduleCreateFormState } from './types';

export const useScheduleCreateForm = (onClose: () => void, initialDate?: Date) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const toISODateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<ScheduleCreateFormState>({
    title: '',
    date: initialDate ? toISODateString(initialDate) : '',
    startTime: '19:00',
    endTime: '21:00',
    placeId: null,
    songId: null,
    teamId: null,
    participantUserIds: [],
    memo: '',
  });

  const { mutateAsync: createSchedule, isPending } = useCreateSchedule();

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

  const handleSubmit = async () => {
    if (isPending || !scheduleType) return;

    try {
      const startAt = `${formData.date}T${formData.startTime}:00Z`;
      const endAt = `${formData.date}T${formData.endTime}:00Z`;

      if (scheduleType === 'PRACTICE') {
        if (!formData.songId || !formData.teamId || !formData.placeId) return;

        const generatedTitle = `합주 연습 (${formData.date})`;

        await createSchedule({
          title: generatedTitle,
          scheduleType: 'PRACTICE',
          startAt,
          endAt,
          placeId: formData.placeId,
          songId: formData.songId,
          teamId: formData.teamId,
          status: 'PLANNED',
        });
      } else if (scheduleType === 'MEETING') {
        await createSchedule({
          title: formData.title,
          scheduleType: 'MEETING',
          startAt,
          endAt,
          participantUserIds: formData.participantUserIds,
          memo: formData.memo,
          status: 'PLANNED',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Schedule creation failed:', error);
    }
  };

  return {
    state: {
      scheduleType,
      currentStep,
      formData,
      isPending,
    },
    actions: {
      handleTypeSelect,
      updateForm,
      handleNextStep,
      handleSubmit,
    },
  };
};
