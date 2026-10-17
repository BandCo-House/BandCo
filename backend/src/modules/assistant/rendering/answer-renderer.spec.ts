import { AnswerRenderer } from './answer-renderer';

describe('AnswerRenderer', () => {
  const renderer = new AnswerRenderer();

  it('단일 집계 값을 짧은 요약으로 만든다', () => {
    expect(renderer.render('밴드 멤버 수', [{ member_count: 3 }])).toBe('밴드 멤버 수: 3');
  });

  it('목록은 행을 나열하지 않고 개수만 말한다', () => {
    const rows = Array.from({ length: 7 }, (_, index) => ({ nickname: `멤버${index + 1}` }));

    expect(renderer.render('다음 합주 미응답자', rows, 'LIST')).toBe('다음 합주 미응답자 7명');
    expect(renderer.render('밴드 곡', [{ title: '알파' }, { title: '베타' }], 'LIST')).toBe('밴드 곡 2건');
  });

  it('상위 N개는 1위와 나머지 개수를 말한다', () => {
    const rows = [
      { title: '실험곡 24', practice_count: 2 },
      { title: '실험곡 17', practice_count: 2 },
      { title: '실험곡 19', practice_count: 1 },
    ];

    expect(renderer.render('8월 최다 연습 곡', rows, 'TOP_N')).toBe('8월 최다 연습 곡: 실험곡 24 외 2건');
  });

  it('빈 결과를 명확히 알린다', () => {
    expect(renderer.render('기타 멤버', [])).toBe('기타 멤버: 조건에 맞는 결과가 없어요.');
  });

  it('한 행은 값만 이어 붙이고 BigInt와 날짜를 읽을 수 있게 표시한다', () => {
    const summary = renderer.render('다음 합주', [{ title: '정기 합주', start_at: new Date('2026-08-31T10:00:00.000Z'), member_count: BigInt(3) }]);

    expect(summary).toBe('다음 합주: 정기 합주 · 2026. 8. 31. 19:00 · 3');
  });
});
