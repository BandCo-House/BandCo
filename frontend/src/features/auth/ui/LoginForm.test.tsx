import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import type { ReactNode } from "react";

// Link 모킹 추가
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => (
    <a data-testid="link">{children}</a>
  ),
}));

describe("LoginForm", () => {
  it("이메일과 비밀번호 입력란이 렌더링되어야 한다", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
  });

  it("스키마를 만족하지 않는 입력값에서는 로그인 버튼이 비활성 상태여야 한다", async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/비밀번호/i);
    const submitButton = screen.getByRole("button", { name: /로그인/i });

    await userEvent.type(emailInput, "invalid-email");
    await userEvent.type(passwordInput, "password123!");

    expect(submitButton).toBeDisabled();
  });

  it("올바른 입력 후 로그인 버튼을 누르면 onSubmit이 호출되어야 한다", () => {
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole("button", { name: /로그인/i });

    fireEvent.change(screen.getByLabelText(/이메일/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/비밀번호/i), {
      target: { value: "password123!" },
    });

    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith("test@test.com", "password123!");
  });
});
