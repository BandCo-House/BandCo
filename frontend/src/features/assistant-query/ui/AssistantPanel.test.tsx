import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssistantAnswer } from '@/entities/assistant/model/types';
import { AssistantConversationProvider } from './AssistantConversationProvider';
import { AssistantDock } from './AssistantDock';
import { AssistantHeaderAction } from './AssistantHeaderAction';
import { AssistantPanel } from './AssistantPanel';

const askMock = vi.fn();
const useAssistantPresetsMock = vi.fn();

vi.mock('@/entities/assistant/api/useAssistant', () => ({
  useAssistantPresets: () => useAssistantPresetsMock(),
  useAskAssistant: () => ({ mutateAsync: askMock }),
}));

const presets = [
  {
    id: 'next-schedule',
    label: '다음 합주',
    question: '다음 합주 일정이 언제야?',
    followUps: [
      '다음 합주에 참석하는 사람은 몇 명이야?',
      '다음 합주에서 연습할 곡은 뭐야?',
    ],
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

const SCHEDULE_ANSWER = tableAnswer({
  columns: [{ key: 'title', label: '일정', format: 'plain' }],
  rows: [{ title: '정기 합주' }],
});

const setup = (answer: AssistantAnswer = SCHEDULE_ANSWER) => {
  useAssistantPresetsMock.mockReturnValue({ data: presets });
  askMock.mockResolvedValue(answer);
  return render(
    <AssistantConversationProvider>
      <AssistantHeaderAction bandId="band-1" />
      <AssistantPanel bandId="band-1" />
      <AssistantDock currentBandId="band-1" pathname="/band/band-1" />
    </AssistantConversationProvider>,
  );
};

/** 서버에 보낸 질문 본문. bandId는 늘 지금 밴드여야 한다. */
/**
 * 요청 본문에는 측정용 세션 키가 함께 실린다.
 * 값은 매번 새로 만들어지므로 모양만 확인하고, 세션 동작은 아래 describe에서 따로 본다.
 */
const asked = (body: object, turnIndex = 0) => ({
  bandId: 'band-1',
  body: { ...body, sessionId: expect.any(String), turnIndex },
});

const homeInput = () =>
  screen.getAllByRole('textbox', { name: '밴드 데이터에 대한 질문' })[0];

const askByPreset = () =>
  userEvent.click(
    screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
  );

describe('AssistantPanel', () => {
  beforeEach(() => askMock.mockReset());

  it('홈에는 질문 입력창과 추천 칩이 있고 질문 버튼은 입력을 시작할 때 나타난다', async () => {
    setup();

    expect(screen.getByText('다음 합주')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '질문' }),
    ).not.toBeInTheDocument();

    await userEvent.click(homeInput());
    expect(screen.getByRole('button', { name: '질문' })).toBeDisabled();
  });

  it('홈에서 보낸 자유 질문은 대화 화면에서 말풍선으로 보이고 question으로 묻는다', async () => {
    setup();

    await userEvent.type(homeInput(), '지난달 합주 몇 번 했어?');
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('지난달 합주 몇 번 했어?'),
    ).toBeInTheDocument();
    expect(askMock).toHaveBeenCalledWith(
      asked({
        question: '지난달 합주 몇 번 했어?',
      }),
    );
  });

  it('추천 칩을 누르면 presetId로 묻는다', async () => {
    setup();

    await askByPreset();

    expect(askMock).toHaveBeenCalledWith(asked({ presetId: 'next-schedule' }));
    expect(await screen.findByText('정기 합주')).toBeInTheDocument();
  });

  it('이어서 물어보기는 짝지은 질문을 question으로 보내고 이전 답 아래에 쌓는다', async () => {
    setup();

    await askByPreset();
    await userEvent.click(
      await screen.findByRole('button', {
        name: '다음 합주에서 연습할 곡은 뭐야?',
      }),
    );

    expect(askMock).toHaveBeenLastCalledWith(
      asked(
        {
          question: '다음 합주에서 연습할 곡은 뭐야?',
        },
        1,
      ),
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByRole('article')).toHaveLength(2);
    // 이미 물은 짝 질문은 빠지고 남은 짝 질문만 마지막 답 아래에 보인다.
    expect(
      await within(dialog).findByRole('button', {
        name: '다음 합주에 참석하는 사람은 몇 명이야?',
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', {
        name: '다음 합주에서 연습할 곡은 뭐야?',
      }),
    ).not.toBeInTheDocument();
  });

  it('닫아도 대화가 남아 이어서 보기 바로 다시 열 수 있다', async () => {
    setup();

    await askByPreset();
    await screen.findByText('정기 합주');
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: '물어보기 대화 이어서 보기' }),
    );
    expect(
      within(await screen.findByRole('dialog')).getAllByRole('article'),
    ).toHaveLength(1);
  });

  it('홈 카드에서 다시 물으면 이전 대화를 이어 붙이지 않고 새 대화로 시작한다', async () => {
    setup();

    await askByPreset();
    await screen.findByText('정기 합주');
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    await userEvent.type(homeInput(), '다음 합주 언제야?');
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('article')).toHaveLength(1);
    expect(within(dialog).getByText('다음 합주 언제야?')).toBeInTheDocument();
  });

  it('새 대화를 누르면 이전 질문을 비우고 추천 질문부터 보여준다', async () => {
    setup();

    await askByPreset();
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('정기 합주');
    await userEvent.click(
      within(dialog).getByRole('button', { name: '새 대화' }),
    );

    expect(within(dialog).queryAllByRole('article')).toHaveLength(0);
    expect(
      within(dialog).getByText('이런 질문은 바로 답할 수 있어요'),
    ).toBeInTheDocument();
  });

  it('대화를 끝내면 이어서 보기 바가 사라진다', async () => {
    setup();

    await askByPreset();
    await screen.findByText('정기 합주');
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    await userEvent.click(screen.getByRole('button', { name: '대화 끝내기' }));

    expect(
      screen.queryByRole('button', { name: '물어보기 대화 이어서 보기' }),
    ).not.toBeInTheDocument();
  });

  it('대화 화면이 열린 채 경로가 바뀌면 화면을 내리고 대화는 남긴다', async () => {
    const { rerender } = setup();

    await askByPreset();
    await screen.findByText('정기 합주');
    rerender(
      <AssistantConversationProvider>
        <AssistantHeaderAction bandId="band-1" />
        <AssistantPanel bandId="band-1" />
        <AssistantDock currentBandId="band-1" pathname="/band/band-1/archive" />
      </AssistantConversationProvider>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '물어보기 대화 이어서 보기' }),
    ).toBeInTheDocument();
  });

  it('헤더 아이콘으로 열면 빈 대화 화면에서 추천 질문으로 바로 물을 수 있다', async () => {
    setup();

    await userEvent.click(
      screen.getByRole('button', { name: '밴드에 물어보기' }),
    );
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: '다음 합주 일정이 언제야?' }),
    );

    expect(askMock).toHaveBeenCalledWith(asked({ presetId: 'next-schedule' }));
    expect(await within(dialog).findByText('정기 합주')).toBeInTheDocument();
  });

  it('집계 결과는 표 대신 큰 숫자로, 설명은 결과 제목 헤드라인으로 보여준다', async () => {
    setup(
      tableAnswer({
        title: '다음 합주 참석 인원',
        resultMode: 'AGGREGATE',
        columns: [
          { key: 'attendee_count', label: '참석 인원', format: 'plain' },
        ],
        rows: [{ attendee_count: 13 }],
        conditions: ['일정 종류: 합주', '응답: 참석'],
      }),
    );

    await askByPreset();

    expect(await screen.findByLabelText('조회 결과')).toHaveTextContent('13');
    expect(screen.getByText('다음 합주 참석 인원')).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('조회 조건')).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('이름 목록은 칩으로 보여주고 50건 초과 안내는 한 번만 한다', async () => {
    setup(
      tableAnswer(
        {
          hasMore: true,
          columns: [{ key: 'nickname', label: '닉네임', format: 'plain' }],
          rows: [{ nickname: '도윤' }, { nickname: '서연' }],
        },
        '다음 합주 미응답자 2명',
      ),
    );

    await askByPreset();

    expect(
      within(await screen.findByLabelText('조회 결과')).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(2);
    expect(screen.getAllByText(/50건까지만 보여요/)).toHaveLength(1);
  });

  it('10건을 넘는 결과는 처음 10건만 보여주고 모두 보기로 펼친다', async () => {
    setup(
      tableAnswer({
        columns: [{ key: 'nickname', label: '닉네임', format: 'plain' }],
        rows: Array.from({ length: 12 }, (_, index) => ({
          nickname: `멤버${index + 1}`,
        })),
      }),
    );

    await askByPreset();
    expect(
      within(await screen.findByLabelText('조회 결과')).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(10);

    await userEvent.click(
      screen.getByRole('button', { name: '12건 모두 보기' }),
    );
    expect(
      within(screen.getByLabelText('조회 결과')).getAllByRole('listitem'),
    ).toHaveLength(12);
  });

  it('여러 열의 상위 결과는 순위와 열 이름을 붙인 세로 목록으로 보여준다', async () => {
    setup(
      tableAnswer({
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
    );

    await askByPreset();

    const items = within(
      await screen.findByLabelText('조회 결과'),
    ).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('1Bohemian Rhapsody연습 횟수 5');
    expect(items[1]).toHaveTextContent('2청춘연습 횟수 3');
  });

  it('한 건은 카드로 보여주고 날짜 열은 한국 시간으로 표시한다', async () => {
    setup(
      tableAnswer({
        resultMode: 'TOP_N',
        columns: [
          { key: 'title', label: '일정', format: 'plain' },
          { key: 'start_at', label: '시작', format: 'datetime' },
        ],
        rows: [{ title: '정기 합주', start_at: '2026-09-03T10:00:00.000Z' }],
      }),
    );

    await askByPreset();

    const card = await screen.findByLabelText('조회 결과');
    expect(within(card).getByText('정기 합주')).toBeInTheDocument();
    expect(within(card).getByText(/9\. 3\. \(목\) 19:00/)).toBeInTheDocument();
  });

  it('질문을 바꿔야 하면 바로 답할 수 있는 예시 질문을 함께 보여준다', async () => {
    setup({
      answerable: false,
      kind: 'REPHRASE',
      summary: '질문을 정확히 이해하지 못했어요.',
      result: null,
      clarification: null,
      meta,
    });

    await askByPreset();

    expect(
      await screen.findByText('질문을 정확히 이해하지 못했어요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('이런 질문은 바로 답할 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('이름 후보를 누르면 서버가 준 질문을 그대로 다시 보낸다', async () => {
    setup({
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
    });

    await askByPreset();
    await userEvent.click(
      await screen.findByRole('button', { name: '아티스트 A' }),
    );

    expect(askMock).toHaveBeenLastCalledWith(
      asked(
        {
          question: "'아티스트 A' 곡 알려줘",
        },
        1,
      ),
    );
  });

  it('요청이 실패하면 질문을 입력창에 되돌리고 같은 요청을 다시 시도할 수 있다', async () => {
    setup();
    askMock.mockRejectedValueOnce(new Error('network'));

    await userEvent.type(homeInput(), '다음 합주 언제야?');
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '잠시 후 다시 시도',
    );
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('textbox', { name: '밴드 데이터에 대한 질문' }),
    ).toHaveValue('다음 합주 언제야?');

    await userEvent.click(
      within(dialog).getByRole('button', { name: '다시 시도' }),
    );
    expect(askMock).toHaveBeenLastCalledWith(
      asked({ question: '다음 합주 언제야?' }),
    );
    expect(await within(dialog).findByText('정기 합주')).toBeInTheDocument();
  });

  it('조회 중에는 입력을 막고 진행 단계를 알린다', async () => {
    setup();
    let finish: (answer: AssistantAnswer) => void = () => {};
    askMock.mockReturnValue(
      new Promise<AssistantAnswer>((resolve) => {
        finish = resolve;
      }),
    );

    await askByPreset();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '질문을 이해하고 있어요',
    );
    expect(
      within(dialog).getByRole('textbox', { name: '밴드 데이터에 대한 질문' }),
    ).toBeDisabled();

    // 응답이 오면 입력을 다시 받는다. 끝나지 않은 요청을 남기지 않는다.
    finish(SCHEDULE_ANSWER);
    expect(await within(dialog).findByText('정기 합주')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('textbox', { name: '밴드 데이터에 대한 질문' }),
    ).toBeEnabled();
  });

  describe('측정용 세션 키', () => {
    const sentBody = (call: number) =>
      askMock.mock.calls[call][0].body as {
        sessionId: string;
        turnIndex: number;
      };

    it('같은 대화에서 이어 물으면 세션은 그대로 두고 턴만 올린다', async () => {
      setup();

      await askByPreset();
      await userEvent.click(
        await screen.findByRole('button', {
          name: '다음 합주에서 연습할 곡은 뭐야?',
        }),
      );

      expect(sentBody(0).sessionId).toBe(sentBody(1).sessionId);
      expect(sentBody(0).turnIndex).toBe(0);
      expect(sentBody(1).turnIndex).toBe(1);
    });

    it('새 대화로 시작하면 세션 키가 바뀌고 턴이 0부터 다시 센다', async () => {
      setup();

      await askByPreset();
      await userEvent.click(screen.getByRole('button', { name: '새 대화' }));
      await askByPreset();

      expect(sentBody(1).sessionId).not.toBe(sentBody(0).sessionId);
      expect(sentBody(1).turnIndex).toBe(0);
    });

    // 재시도가 턴을 새로 세면 턴별 실패율이 왜곡된다.
    it('다시 시도는 같은 턴으로 보낸다', async () => {
      setup();
      askMock.mockRejectedValueOnce(new Error('network'));

      await userEvent.type(homeInput(), '다음 합주 언제야?');
      await userEvent.click(screen.getByRole('button', { name: '질문' }));
      await screen.findByRole('alert');
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: '다시 시도',
        }),
      );

      expect(sentBody(1).sessionId).toBe(sentBody(0).sessionId);
      expect(sentBody(1).turnIndex).toBe(sentBody(0).turnIndex);
    });
  });
});
