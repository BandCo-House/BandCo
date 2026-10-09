import { detectSignals, resolveExecutedBucket, type SignalInput } from './assistant-query-signal';

const base: SignalInput = {
  resultMode: 'LIST',
  page: { rows: [{ nickname: '초록' }], hasMore: false },
  question: '관리자 역할인 멤버 알려줘',
  generatedSql: 'SELECT up.nickname FROM bands b WHERE b.id = $1::uuid',
  parameterTypes: [],
  validationFailures: 0,
  policyViolations: [],
};

describe('detectSignals', () => {
  it('의심할 자리가 없으면 신호를 붙이지 않는다', () => {
    expect(detectSignals(base)).toEqual([]);
  });

  it('실행은 성공했지만 결과가 0행이면 EMPTY_RESULT를 붙인다', () => {
    expect(detectSignals({ ...base, page: { rows: [], hasMore: false } })).toContain('EMPTY_RESULT');
  });

  it('단일 집계가 0이면 ZERO_VALUE를 붙인다', () => {
    const signals = detectSignals({ ...base, resultMode: 'AGGREGATE', page: { rows: [{ member_count: 0 }], hasMore: false } });

    expect(signals).toContain('ZERO_VALUE');
  });

  it('단일 집계가 null이면 ZERO_VALUE를 붙인다', () => {
    const signals = detectSignals({ ...base, resultMode: 'AGGREGATE', page: { rows: [{ average_rate: null }], hasMore: false } });

    expect(signals).toContain('ZERO_VALUE');
  });

  it('값이 있는 단일 집계에는 ZERO_VALUE를 붙이지 않는다', () => {
    const signals = detectSignals({ ...base, resultMode: 'AGGREGATE', page: { rows: [{ member_count: 12 }], hasMore: false } });

    expect(signals).not.toContain('ZERO_VALUE');
  });

  it('목록의 첫 열이 0이어도 단일 집계가 아니면 ZERO_VALUE를 붙이지 않는다', () => {
    const signals = detectSignals({ ...base, resultMode: 'LIST', page: { rows: [{ count: 0 }], hasMore: false } });

    expect(signals).not.toContain('ZERO_VALUE');
  });

  it('서버 상한에 걸려 뒤가 잘리면 ROW_LIMIT_REACHED를 붙인다', () => {
    expect(detectSignals({ ...base, page: { rows: [{ nickname: '초록' }], hasMore: true } })).toContain('ROW_LIMIT_REACHED');
  });

  it('SQL을 다시 만들었으면 REGENERATED를 붙인다', () => {
    expect(detectSignals({ ...base, validationFailures: 1 })).toContain('REGENERATED');
  });

  it('허용 목록 밖을 건드렸으면 POLICY_VIOLATION을 붙인다', () => {
    expect(detectSignals({ ...base, policyViolations: ['TABLE_NOT_ALLOWED'] })).toContain('POLICY_VIOLATION');
  });

  describe('MISSING_DATE_FILTER', () => {
    it('질문이 기간을 말했는데 시간 파라미터도 함수도 없으면 붙인다', () => {
      const signals = detectSignals({ ...base, question: '지난달 합주 몇 번 했어?', parameterTypes: ['TEXT'] });

      expect(signals).toContain('MISSING_DATE_FILTER');
    });

    it('시간 파라미터가 있으면 붙이지 않는다', () => {
      const signals = detectSignals({ ...base, question: '지난달 합주 몇 번 했어?', parameterTypes: ['TEXT', 'TIMESTAMPTZ'] });

      expect(signals).not.toContain('MISSING_DATE_FILTER');
    });

    it('파라미터 없이 CURRENT_DATE로 좁혔으면 붙이지 않는다', () => {
      const signals = detectSignals({
        ...base,
        question: '오늘 일정 알려줘',
        generatedSql: 'SELECT sc.id FROM schedules sc WHERE sc.start_at >= CURRENT_DATE',
      });

      expect(signals).not.toContain('MISSING_DATE_FILTER');
    });

    it('질문에 기간 표현이 없으면 붙이지 않는다', () => {
      expect(detectSignals({ ...base, question: '우리 밴드 멤버 몇 명이야?' })).not.toContain('MISSING_DATE_FILTER');
    });

    it('추천 질문처럼 질문 문장이 없으면 붙이지 않는다', () => {
      expect(detectSignals({ ...base, question: null })).not.toContain('MISSING_DATE_FILTER');
    });
  });
});

describe('resolveExecutedBucket', () => {
  it('신호가 없으면 OK다', () => {
    expect(resolveExecutedBucket([])).toBe('OK');
  });

  it('정책 위반이 가장 먼저 설명이 되므로 다른 신호보다 앞선다', () => {
    expect(resolveExecutedBucket(['EMPTY_RESULT', 'POLICY_VIOLATION'])).toBe('POLICY_VIOLATION');
  });

  it('0행은 EMPTY_RESULT로 분류한다', () => {
    expect(resolveExecutedBucket(['EMPTY_RESULT', 'ROW_LIMIT_REACHED'])).toBe('EMPTY_RESULT');
  });

  it('상한 도달은 TRUNCATED로 분류한다', () => {
    expect(resolveExecutedBucket(['ROW_LIMIT_REACHED'])).toBe('TRUNCATED');
  });

  it('분류가 안 되는 신호만 있으면 OK로 두고 판정에 넘긴다', () => {
    expect(resolveExecutedBucket(['MISSING_DATE_FILTER'])).toBe('OK');
  });
});
