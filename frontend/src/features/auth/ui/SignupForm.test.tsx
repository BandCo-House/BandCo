import { beforeAll, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from './SignupForm';

describe('SignupForm', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('이메일, 비밀번호, 비밀번호 확인, 이름 입력란이 렌더링되어야 한다', () => {
    render(<SignupForm onSubmit={vi.fn()} />);

    expect(
      screen.getByPlaceholderText('이메일을 입력하세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('비밀번호를 입력하세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('비밀번호를 다시 입력하세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('이름을 입력하세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('불일치')).not.toBeInTheDocument();
  });

  it('올바른 입력과 필수 약관 동의 후 가입하기 버튼을 누르면 onSubmit이 호출되어야 한다', () => {
    const handleSubmit = vi.fn();

    render(<SignupForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요.'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요.'), {
      target: { value: 'password123!' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('비밀번호를 다시 입력하세요.'),
      {
        target: { value: 'password123!' },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('이름을 입력하세요.'), {
      target: { value: '홍길동' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));

    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123!',
      name: '홍길동',
    });
  });

  it('스키마를 만족하지 않는 입력값에서는 회원가입 버튼이 비활성 상태여야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    await user.type(
      screen.getByPlaceholderText('이메일을 입력하세요.'),
      'invalid-email',
    );
    await user.type(
      screen.getByPlaceholderText('비밀번호를 입력하세요.'),
      'password123!',
    );
    await user.type(
      screen.getByPlaceholderText('비밀번호를 다시 입력하세요.'),
      'password123!',
    );
    await user.type(
      screen.getByPlaceholderText('이름을 입력하세요.'),
      '홍길동',
    );
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));

    expect(submitButton).toBeDisabled();
  });

  it('비밀번호 확인 값이 일치하면 체크 아이콘 액션을 표시해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('비밀번호를 입력하세요.'),
      'password123!',
    );
    await user.type(
      screen.getByPlaceholderText('비밀번호를 다시 입력하세요.'),
      'password123!',
    );

    expect(screen.queryByText('불일치')).not.toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 일치')).toHaveClass(
      'bg-primary-light',
    );
  });

  it('비밀번호 확인 값이 일치하지 않으면 불일치 액션을 표시해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('비밀번호를 입력하세요.'),
      'password123!',
    );
    await user.type(
      screen.getByPlaceholderText('비밀번호를 다시 입력하세요.'),
      'password1234!',
    );

    expect(screen.getByText('불일치')).toBeInTheDocument();
    expect(screen.queryByLabelText('비밀번호 일치')).not.toBeInTheDocument();
  });

  it('이메일 중복 확인 결과가 중복이면 이메일 오류 메시지를 표시해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText('이메일을 입력하세요.'),
      'duplicate@test.com',
    );
    await user.click(screen.getByRole('button', { name: '중복 확인' }));

    expect(
      await screen.findByText('이미 사용 중인 이메일입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '중복 확인' }),
    ).toBeInTheDocument();
    expect(screen.getByText('중복')).toBeInTheDocument();
  });
});
