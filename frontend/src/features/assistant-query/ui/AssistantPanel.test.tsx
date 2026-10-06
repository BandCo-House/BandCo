import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantAnswer } from '@/entities/assistant/model/types';
import { AssistantPanel } from './AssistantPanel';

const askMock = vi.fn();
const useAskAssistantMock = vi.fn();
const useAssistantPresetsMock = vi.fn();

vi.mock('@/entities/assistant/api/useAssistant', () => ({
  useAssistantPresets: () => useAssistantPresetsMock(),
  useAskAssistant: (...args: unknown[]) => useAskAssistantMock(...args),
}));

const presets = [
  {
    id: 'next-schedule',
    label: '다음 합주',
    question: '다음 합주 일정이 언제야?',
  },
  {
    id: 'pending-attendance',
    label: '미응답자',
    question: '아직 참석 여부를 응답하지 않은 사람은?',
  },
];

const meta: AssistantAnswer['meta'] = {
  providerName: 'gemini',
  modelName: 'gemini-3.1-flash-lite',
  usedLlm: true,
  inputTokens: 0,
  outputTokens: 0,
  latencyMs: 10,
};

type TableResult = Extract<
  NonNullable<AssistantAnswer['result']>,
  { entity: 'table' }
>;

const tableAnswer = (
  result: Partial<TableResult> & Pick<TableResult, 'columns' | 'rows'>,
  summary = '요약',
): AssistantAnswer => ({
  answerable: true,
  kind: 'ANSWER',
  summary,
  clarification: null,
  meta,
  result: {
    entity: 'table',
    title: '결과',
    hasMore: false,
    maxRows: 50,
    resultMode: 'LIST',
    conditions: [],
    ...result,
  },
});

const setup = (mutationState: Record<string, unknown> = {}) => {
  useAssistantPresetsMock.mockReturnValue({ data: presets });
  useAskAssistantMock.mockReturnValue({
    mutate: askMock,
    data: undefined,
    isPending: false,
    error: null,
    ...mutationState,
  });

  return render(<AssistantPanel bandId="band-1" />);
};

const askByPreset = () =>
  userEvent.click(
    screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
  );

describe('AssistantPanel', () => {
  it('홈에는 입력 한 줄과 짧은 이름의 추천 질문 칩만 보여준다', () => {
    setup();

    expect(
      screen.getByRole('button', { name: '밴드 데이터에 대해 질문하기' }),
    ).toBeInTheDocument();
    expect(screen.getByText('다음 합주')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('추천 칩을 누르면 전체 화면 시트에서 presetId만 보낸다', async () => {
    setup();

    await askByPreset();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(askMock).toHaveBeenCalledWith(
      { presetId: 'next-schedule' },
      expect.any(Object),
    );
  });

  it('입력창을 눌러 연 시트에서 자유 질문을 question으로 보낸다', async () => {
    setup();

    await userEvent.click(
      screen.getByRole('button', { name: '밴드 데이터에 대해 질문하기' }),
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: '밴드 데이터에 대한 질문' }),
      '지난달 합주 몇 번 했어?',
    );
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    expect(askMock).toHaveBeenCalledWith(
      { question: '지난달 합주 몇 번 했어?' },
      expect.any(Object),
    );
  });

  it('집계 결과는 표 대신 큰 숫자와 결과 제목으로 보여준다', async () => {
    setup({
      data: tableAnswer({
        title: '다음 합주 참석 인원',
        resultMode: 'AGGREGATE',
        columns: [
          { key: 'attendee_count', label: '참석 인원', format: 'plain' },
        ],
        rows: [{ attendee_count: 13 }],
        conditions: ['일정 종류: 합주', '응답: 참석'],
      }),
    });

    await askByPreset();

    const result = screen.getByLabelText('조회 결과');
    expect(within(result).getByText('13')).toBeInTheDocument();
    expect(within(result).getByText('다음 합주 참석 인원')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText('조회 조건')).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('이름 목록은 칩으로 보여주고 50건 초과 안내는 한 번만 한다', async () => {
    setup({
      data: tableAnswer(
        {
          hasMore: true,
          columns: [{ key: 'nickname', label: '닉네임', format: 'plain' }],
          rows: [{ nickname: '도윤' }, { nickname: '서연' }],
        },
        '다음 합주 미응답자 2명',
      ),
    });

    await askByPreset();

    expect(
      within(screen.getByLabelText('조회 결과')).getAllByRole('listitem'),
    ).toHaveLength(2);
    expect(screen.getAllByText(/50건까지만 보여요/)).toHaveLength(1);
  });

  it('여러 열의 상위 결과는 순위와 열 이름을 붙인 세로 목록으로 보여준다', async () => {
    setup({
      data: tableAnswer({
        resultMode: 'TOP_N',
        columns: [
          { key: 'title', label: '곡 제목', format: 'plain' },
          { key: 'practice_count', label: '연습 횟수', format: 'plain' },
        ],
        rows: [
          { title: 'Bohemian Rhapsody', practice_count: 5 },
          { title: '청춘', practice_count: 3 },
        ],
      }),
    });

    await askByPreset();

    const items = within(screen.getByLabelText('조회 결과')).getAllByRole(
      'listitem',
    );
    expect(items[0]).toHaveTextContent('1Bohemian Rhapsody연습 횟수 5');
    expect(items[1]).toHaveTextContent('2청춘연습 횟수 3');
  });

  it('한 건은 카드로 보여주고 날짜 열은 한국 시간으로 표시한다', async () => {
    setup({
      data: tableAnswer({
        resultMode: 'TOP_N',
        columns: [
          { key: 'title', label: '일정', format: 'plain' },
          { key: 'start_at', label: '시작', format: 'datetime' },
        ],
        rows: [{ title: '정기 합주', start_at: '2026-09-03T10:00:00.000Z' }],
      }),
    });

    await askByPreset();

    const card = screen.getByLabelText('조회 결과');
    expect(within(card).getByText('정기 합주')).toBeInTheDocument();
    expect(within(card).getByText(/9\. 3\. \(목\) 19:00/)).toBeInTheDocument();
  });

  it('답할 수 없거나 질문을 바꿔야 하면 물어볼 수 있는 예시 질문을 함께 보여준다', async () => {
    setup({
      data: {
        answerable: false,
        kind: 'REPHRASE',
        summary: '질문을 정확히 이해하지 못했어요.',
        result: null,
        clarification: null,
        meta,
      } satisfies AssistantAnswer,
    });

    await askByPreset();

    expect(
      screen.getByText('질문을 정확히 이해하지 못했어요.'),
    ).toBeInTheDocument();
    expect(screen.getByText('이렇게 물어보면 찾기 쉬워요')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('이름 후보를 누르면 서버가 준 질문을 그대로 다시 보낸다', async () => {
    setup({
      data: {
        answerable: false,
        kind: 'CLARIFICATION',
        summary: '어떤 아티스트인가요?',
        result: null,
        clarification: {
          candidates: [
            { name: '아티스트 A', question: "'아티스트 A' 곡 알려줘" },
          ],
          hasMore: false,
        },
        meta,
      } satisfies AssistantAnswer,
    });

    await askByPreset();
    await userEvent.click(screen.getByRole('button', { name: '아티스트 A' }));

    expect(askMock).toHaveBeenLastCalledWith(
      { question: "'아티스트 A' 곡 알려줘" },
      expect.any(Object),
    );
  });

  it('요청이 실패하면 입력한 질문을 입력창에 되돌리고 같은 요청을 다시 시도할 수 있다', async () => {
    askMock.mockImplementation((_body, options: { onError: () => void }) =>
      options.onError(),
    );
    setup({ error: new Error('network') });

    await userEvent.click(
      screen.getByRole('button', { name: '밴드 데이터에 대해 질문하기' }),
    );
    const input = screen.getByRole('textbox', {
      name: '밴드 데이터에 대한 질문',
    });
    await userEvent.type(input, '다음 합주 언제야?');
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    expect(screen.getByRole('alert')).toHaveTextContent('잠시 후 다시 시도');
    expect(input).toHaveValue('다음 합주 언제야?');

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(askMock).toHaveBeenLastCalledWith(
      { question: '다음 합주 언제야?' },
      expect.any(Object),
    );
    askMock.mockReset();
  });

  it('조회 중에는 입력을 막고 진행 단계를 알린다', async () => {
    setup({ isPending: true });

    await askByPreset();

    expect(screen.getByRole('status')).toHaveTextContent(
      '질문을 이해하고 있어요',
    );
    expect(
      screen.getByRole('textbox', { name: '밴드 데이터에 대한 질문' }),
    ).toBeDisabled();
  });
});
