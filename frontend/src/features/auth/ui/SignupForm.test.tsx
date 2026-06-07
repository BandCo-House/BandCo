import { beforeAll, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SignupForm } from './SignupForm';
import { server } from '@/mocks/server';

describe('SignupForm', () => {
  const getFields = () => ({
    name: screen.getByLabelText(/^이름\s*\*$/),
    email: screen.getByLabelText(/^이메일\s*\*$/),
    password: screen.getByLabelText(/^비밀번호\s*\*$/),
    passwordConfirm: screen.getByLabelText(/^비밀번호 확인\s*\*$/),
  });

  beforeAll(() => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('이메일, 비밀번호, 비밀번호 확인, 이름 입력란이 렌더링되어야 한다', () => {
    render(<SignupForm onSubmit={vi.fn()} />);

    const fields = getFields();

    expect(fields.email).toBeInTheDocument();
    expect(fields.password).toBeInTheDocument();
    expect(fields.passwordConfirm).toBeInTheDocument();
    expect(fields.name).toBeInTheDocument();
  });

  it('필수 입력과 약관 동의가 끝나면 가입하기 버튼은 활성화되어야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'test@test.com');
    await user.type(fields.password, 'password123!');
    await user.type(fields.passwordConfirm, 'password123!');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));

    expect(submitButton).toBeEnabled();
  });

  it('올바른 입력, 이메일 사용 가능 확인, 필수 약관 동의 후 가입하기 버튼을 누르면 onSubmit이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<SignupForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'test@test.com');
    await user.type(fields.password, 'password123!');
    await user.type(fields.passwordConfirm, 'password123!');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));
    await user.click(screen.getByRole('button', { name: '중복 확인' }));
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123!',
      name: '홍길동',
    });
  });

  it('필수 입력과 약관 동의가 끝나면 입력 형식이 유효하지 않아도 가입하기 버튼은 활성화되어야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'invalid-email');
    await user.type(fields.password, 'password123!');
    await user.type(fields.passwordConfirm, 'password123!');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));

    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(
      screen.getByText('올바른 이메일 형식이 아닙니다.'),
    ).toBeInTheDocument();
  });

  it('비밀번호 형식이 유효하지 않은 상태에서 가입하기를 누르면 비밀번호 오류를 안내해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'test@test.com');
    await user.type(fields.password, 'pass12_');
    await user.type(fields.passwordConfirm, 'pass12_');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));
    await user.click(submitButton);

    expect(
      screen.getByText(
        '비밀번호에는 영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다.',
      ),
    ).toBeInTheDocument();
  });

  it('비밀번호가 숫자로만 구성된 상태에서 가입하기를 누르면 조합 오류만 안내해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'test@test.com');
    await user.type(fields.password, '111111');
    await user.type(fields.passwordConfirm, '111111');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));
    await user.click(submitButton);

    expect(
      screen.getByText('비밀번호에는 영문과 숫자를 모두 포함해주세요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        '영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다.',
      ),
    ).not.toBeInTheDocument();
  });

  it('입력값이 유효하지만 이메일 확인 없이 가입하기를 누르면 중복 확인 필요를 안내해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    const fields = getFields();

    await user.type(fields.email, 'test@test.com');
    await user.type(fields.password, 'password123!');
    await user.type(fields.passwordConfirm, 'password123!');
    await user.type(fields.name, '홍길동');
    await user.click(screen.getByRole('checkbox', { name: /전체 이용약관/i }));
    await user.click(submitButton);

    expect(
      screen.getByText('이메일 중복 확인을 완료해주세요.'),
    ).toBeInTheDocument();
  });

  it('이메일 중복 확인 결과가 중복이면 이메일 오류 메시지를 표시해야 한다', async () => {
    const user = userEvent.setup();

    render(<SignupForm onSubmit={vi.fn()} />);
    const fields = getFields();

    await user.type(fields.email, 'duplicate@test.com');
    await user.click(screen.getByRole('button', { name: '중복 확인' }));

    expect(
      await screen.findByText('이미 사용 중인 이메일입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '중복 확인' }),
    ).toBeInTheDocument();
  });

  it('이메일 중복 확인 요청이 실패하면 오류 메시지를 표시하고 확인 버튼 상태를 복구해야 한다', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    server.use(
      http.post('*/auth/email', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    render(<SignupForm onSubmit={vi.fn()} />);
    const fields = getFields();

    await user.type(fields.email, 'error-check@test.com');
    await user.click(screen.getByRole('button', { name: '중복 확인' }));

    expect(
      await screen.findByText(
        '이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '중복 확인' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('확인 중')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
