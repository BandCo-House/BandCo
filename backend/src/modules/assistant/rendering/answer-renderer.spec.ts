import { AnswerRenderer } from './answer-renderer';

describe('AnswerRenderer', () => {
  const renderer = new AnswerRenderer();

  it('단일 집계 값을 짧은 요약으로 만든다', () => {
    expect(renderer.render('밴드 멤버 수', [{ member_count: 3 }])).toBe('밴드 멤버 수: 3');
  });

  it('목록 결과를 최대 다섯 행까지 요약한다', () => {
    const rows = Array.from({ length: 7 }, (_, index) => ({ nickname: `멤버${index + 1}` }));

    expect(renderer.render('밴드 멤버', rows)).toContain('결과 7건입니다.');
    expect(renderer.render('밴드 멤버', rows)).toContain('외 2건');
  });

  it('빈 결과를 명확히 알린다', () => {
    expect(renderer.render('기타 멤버', [])).toBe('기타 멤버 결과가 없습니다.');
  });

  it('BigInt와 날짜를 JSON 안전 문자열로 표시한다', () => {
    const summary = renderer.render('통계', [{ member_count: BigInt(3), start_at: new Date('2026-08-31T10:00:00.000Z') }]);

    expect(summary).toContain('멤버 수 3');
    expect(summary).toContain('시작 시각');
  });
});
