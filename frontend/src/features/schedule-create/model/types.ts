import type { ScheduleType } from '@/entities/schedule/model/types';

export interface ScheduleCreateFormState {
  type: ScheduleType;
  // TODO: Add ensemble/meeting specific fields later
}
