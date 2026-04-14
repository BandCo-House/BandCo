import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("이메일과 비밀번호 입력란이 렌더링되어야 한다", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
  });

  it("유효하지 않은 이메일을 입력하면 에러 메시지를 표시해야 한다", async () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const submitButton = screen.getByRole("button", { name: /로그인/i });

    await userEvent.type(emailInput, "invalid-email");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/이메일 형식이 아닙니다/i)).toBeInTheDocument();
    });
  });

  it("올바른 입력 후 로그인 버튼을 누르면 onSubmit이 호출되어야 한다", async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/이메일/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/비밀번호/i), "password123!");

    fireEvent.click(screen.getByRole("button", { name: /로그인/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith("test@test.com", "password123!");
    });
  });
});
