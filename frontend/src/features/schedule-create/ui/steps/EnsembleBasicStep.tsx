interface Props {
  data: {
    date: string;
    startTime: string;
    endTime: string;
    place: string;
  };
  onChange: (updates: Partial<Props['data']>) => void;
  onNext: () => void;
}

export const EnsembleBasicStep = ({ data, onChange, onNext }: Props) => {
  const isValid = data.date && data.startTime && data.endTime && data.place;

  return (
    <div data-testid="ensemble-step-1">
      <h2>합주 연습 기본 정보</h2>
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
      <div>
        <label htmlFor="place">장소</label>
        <select
          id="place"
          value={data.place}
          onChange={(e) => onChange({ place: e.target.value })}
        >
          <option value="">장소를 선택하세요</option>
          <option value="홍대 합주실">홍대 합주실</option>
          <option value="강남 합주실">강남 합주실</option>
        </select>
      </div>

      <button onClick={onNext} disabled={!isValid}>
        다음
      </button>
    </div>
  );
};
