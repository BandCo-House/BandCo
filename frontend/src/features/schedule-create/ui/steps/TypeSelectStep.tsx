import type { ScheduleType } from '../../model/types';

interface Props {
  onSelect: (type: ScheduleType) => void;
}

export const TypeSelectStep = ({ onSelect }: Props) => {
  return (
    <div data-testid="type-select-step">
      <h2>어떤 일정을 만드시겠어요?</h2>
      <button onClick={() => onSelect("PRACTICE")}>합주 연습</button>
      <button onClick={() => onSelect("MEETING")}>회의</button>
    </div>
  );
};
