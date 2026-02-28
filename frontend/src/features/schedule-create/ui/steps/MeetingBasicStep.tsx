interface Props {
  data: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  onChange: (updates: Partial<Props['data']>) => void;
  onNext: () => void;
}

export const MeetingBasicStep = ({ data, onChange, onNext }: Props) => {
  const isValid = data.title && data.date && data.startTime && data.endTime;

  return (
    <div data-testid="meeting-step-1">
      <h2>회의 기본 정보</h2>
      <div>
        <label htmlFor="title">회의명</label>
        <input
          id="title"
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="date">날짜</label>
        <input
          id="date"
          type="text"
          value={data.date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="start-time">시작 시간</label>
        <input
          id="start-time"
          type="text"
          value={data.startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="end-time">종료 시간</label>
        <input
          id="end-time"
          type="text"
          value={data.endTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
        />
      </div>

      <button onClick={onNext} disabled={!isValid}>
        다음
      </button>
    </div>
  );
};
