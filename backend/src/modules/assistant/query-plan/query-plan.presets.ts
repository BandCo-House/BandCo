export interface AssistantPreset {
  id: string;
  question: string;
}

/** 기존 프론트의 추천 질문 흐름은 유지하고 실행만 Text-to-SQL로 통일한다. */
export const ASSISTANT_PRESETS: AssistantPreset[] = [
  { id: 'next-schedule', question: '다음 합주 일정이 언제야?' },
  { id: 'pending-attendance', question: '아직 참석 여부를 응답하지 않은 사람은?' },
  { id: 'most-practiced-song-this-month', question: '이번 달 가장 많이 연습한 곡은?' },
  { id: 'most-active-member-3months', question: '최근 3개월 동안 합주에 가장 많이 참여한 멤버는?' },
];

/** ID와 일치하는 추천 질문을 찾는다. */
export function findPresetById(presetId: string): AssistantPreset | undefined {
  return ASSISTANT_PRESETS.find(preset => preset.id === presetId);
}
