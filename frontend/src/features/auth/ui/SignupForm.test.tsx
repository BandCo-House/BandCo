import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./SignupForm";

// Link 모킹 추가
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: any) => <a data-testid="link">{children}</a>,
}));

describe("SignupForm", () => {
  it("이메일, 비밀번호, 이름 입력란이 렌더링되어야 한다", () => {
    render(<SignupForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/이름/i)).toBeInTheDocument();
  });

  it("올바른 입력 후 회원가입 버튼을 누르면 onSubmit이 호출되어야 한다", async () => {
    const handleSubmit = vi.fn();
    render(<SignupForm onSubmit={handleSubmit} />);

    await userEvent.type(screen.getByLabelText(/이메일/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/비밀번호/i), "password123!");
    await userEvent.type(screen.getByLabelText(/이름/i), "홍길동");

    fireEvent.click(screen.getByRole("button", { name: /회원가입/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123!",
        name: "홍길동",
      });
    });
  });
});
