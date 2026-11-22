import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useHandleField } from '../model/useHandleField';
import { HandleEditField } from './HandleEditField';

const Harness = ({
  currentHandle,
  changeableAt = null,
}: {
  currentHandle: string | null;
  changeableAt?: string | null;
}) => {
  const field = useHandleField(currentHandle);
  return (
    <>
      <HandleEditField field={field} changeableAt={changeableAt} />
      <span data-testid="block-reason">{field.saveBlockReason ?? 'ok'}</span>
    </>
  );
};

const blockReason = () => screen.getByTestId('block-reason').textContent;

describe('HandleEditField', () => {
  it('입력이 멈추면 형식부터 검사하고, 틀린 값은 저장을 막는다', async () => {
    const user = userEvent.setup();
    render(<Harness currentHandle={null} />);

    await user.type(screen.getByLabelText('고유 ID'), 'ab');

    expect(await screen.findByRole('status')).toHaveTextContent(/4~8자/);
    expect(screen.getByLabelText('고유 ID')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(blockReason()).toMatch(/4~8자/);
  });

  it('다른 사람이 쓰는 ID는 대소문자가 달라도 사용 중으로 안내한다', async () => {
    const user = userEvent.setup();
    render(<Harness currentHandle={null} />);

    // mock 검색 유저가 쓰는 NY_03ABC
    await user.type(screen.getByLabelText('고유 ID'), 'ny_03abc');

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        '이미 사용 중인 고유 ID예요.',
      ),
    );
    expect(blockReason()).toBe('이미 사용 중인 고유 ID예요.');
  });

  it('비어 있는 ID면 자동 확인이 끝나야 저장할 수 있다', async () => {
    const user = userEvent.setup();
    render(<Harness currentHandle={null} />);

    await user.type(screen.getByLabelText('고유 ID'), 'newbie1');
    expect(blockReason()).not.toBe('ok');

    expect(
      await screen.findByText('사용할 수 있는 고유 ID예요.'),
    ).toBeInTheDocument();
    expect(blockReason()).toBe('ok');
  });

  it('확인한 뒤 값을 고치면 다시 확인될 때까지 저장을 막는다', async () => {
    const user = userEvent.setup();
    render(<Harness currentHandle={null} />);

    await user.type(screen.getByLabelText('고유 ID'), 'newbie1');
    await screen.findByText('사용할 수 있는 고유 ID예요.');
    await user.type(screen.getByLabelText('고유 ID'), '2');

    expect(blockReason()).not.toBe('ok');
  });

  it('지금 값 그대로면 확인 없이 저장할 수 있다', () => {
    render(<Harness currentHandle="minsu_k" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(blockReason()).toBe('ok');
  });

  it('처음 정할 때와 바꿀 때 서로 다른 제한 규칙을 미리 알린다', () => {
    const { unmount } = render(<Harness currentHandle={null} />);
    expect(screen.getByLabelText('고유 ID')).toHaveAccessibleDescription(
      /한 번 바로 고칠 수 있고/,
    );
    unmount();

    render(<Harness currentHandle="minsu_k" />);
    expect(screen.getByLabelText('고유 ID')).toHaveAccessibleDescription(
      /바꾸면 7일 동안 다시 바꿀 수 없어요/,
    );
  });

  it('7일 제한 중이면 입력을 잠그고 다음 변경 가능 시각을 보여준다', () => {
    render(
      <Harness
        currentHandle="minsu_k"
        changeableAt="2026-10-26T06:00:00.000Z"
      />,
    );

    const input = screen.getByLabelText('고유 ID');
    expect(input).toBeDisabled();
    expect(input).toHaveAccessibleDescription(/이후에 다시 바꿀 수 있어요/);
  });
});
