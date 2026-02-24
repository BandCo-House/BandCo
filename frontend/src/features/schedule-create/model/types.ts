export type ScheduleType = 'ensemble' | 'meeting';

export interface ScheduleCreateFormState {
  type: ScheduleType;
  // TODO: Add ensemble/meeting specific fields later
}
