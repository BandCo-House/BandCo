import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AssistantPanel } from './AssistantPanel';

const askMock = vi.fn();
const useAskAssistantMock = vi.fn();
const useAssistantPresetsMock = vi.fn();

vi.mock('@/entities/assistant/api/useAssistant', () => ({
  useAssistantPresets: () => useAssistantPresetsMock(),
  useAskAssistant: (...args: unknown[]) => useAskAssistantMock(...args),
}));

const presets = [
  { id: 'next-schedule', question: '다음 합주 일정이 언제야?' },
  {
    id: 'pending-attendance',
    question: '아직 참석 여부를 응답하지 않은 사람은?',
  },
];

const createMeta = (usedLlm: boolean) => ({
  providerName: usedLlm ? 'gemini' : null,
  modelName: usedLlm ? 'gemini-3.1-flash-lite' : null,
  usedLlm,
  inputTokens: 0,
  outputTokens: 0,
  latencyMs: 10,
});

const setup = (mutationState: Record<string, unknown> = {}) => {
  useAssistantPresetsMock.mockReturnValue({ data: presets });
  useAskAssistantMock.mockReturnValue({
    mutate: askMock,
    data: undefined,
    isPending: false,
    isError: false,
    reset: vi.fn(),
    ...mutationState,
  });

  return render(<AssistantPanel bandId="band-1" />);
};

describe('AssistantPanel', () => {
  it('추천 질문을 버튼으로 노출한다', () => {
    setup();

    expect(
      screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
    ).toBeInTheDocument();
  });

  it('추천 질문을 누르면 질문 문장 없이 presetId만 보낸다', async () => {
    askMock.mockClear();
    setup();

    await userEvent.click(
      screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
    );

    expect(askMock).toHaveBeenCalledWith({ presetId: 'next-schedule' });
  });

  it('자유 질문은 question으로 보낸다', async () => {
    askMock.mockClear();
    setup();

    await userEvent.type(
      screen.getByLabelText('밴드 데이터에 대한 질문'),
      '지난달 합주 몇 번 했어?',
    );
    await userEvent.click(screen.getByRole('button', { name: '질문' }));

    await waitFor(() =>
      expect(askMock).toHaveBeenCalledWith({
        question: '지난달 합주 몇 번 했어?',
      }),
    );
  });

  it('답변을 받으면 요약과 목록을 함께 표시한다', async () => {
    setup({
      data: {
        answerable: true,
        summary: '9월 3일 (수) 19:00 정기 합주 일정이 있습니다.',
        result: {
          entity: 'schedule',
          rows: [
            {
              id: 'schedule-1',
              title: '정기 합주',
              scheduleType: 'PRACTICE',
              status: 'PLANNED',
              startAt: '2026-09-03T19:00:00+09:00',
              endAt: null,
              placeName: '홍대 스튜디오',
              spaceName: '가을 공연',
            },
          ],
        },
        meta: createMeta(false),
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
    );

    expect(
      screen.getByText('9월 3일 (수) 19:00 정기 합주 일정이 있습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('정기 합주')).toBeInTheDocument();
  });

  it('답할 수 없는 질문은 오류가 아니라 안내 문구로 보여준다', async () => {
    const summary =
      '이 질문은 아직 답할 수 없습니다. 일정, 참석 현황, 곡별 합주 횟수, 멤버별 참석 횟수를 물어봐 주세요.';
    setup({
      data: {
        answerable: false,
        summary,
        result: null,
        meta: createMeta(true),
      },
    });

    await userEvent.click(
      screen.getByRole('button', { name: '다음 합주 일정이 언제야?' }),
    );

    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(
      screen.queryByText(
        '지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.',
      ),
    ).not.toBeInTheDocument();
  });

  it('조회 중에는 입력을 막는다', () => {
    setup({ isPending: true });

    expect(screen.getByLabelText('밴드 데이터에 대한 질문')).toBeDisabled();
  });
});
