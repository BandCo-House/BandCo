import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackButton } from "./back-button";

// 모킹: @tanstack/react-router
const mockHistoryBack = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    history: {
      back: mockHistoryBack,
    },
  }),
}));

describe("BackButton", () => {
  beforeEach(() => {
    mockHistoryBack.mockClear();
  });

  it("기본 렌더링: 아이콘과 라벨이 표시된다", () => {
    render(<BackButton label="뒤로가기" />);
    // 아이콘은 svg로 렌더링됨
    expect(document.querySelector("svg")).toBeInTheDocument();
    // 라벨 텍스트 확인
    expect(screen.getByText("뒤로가기")).toBeInTheDocument();
  });

  it("라벨이 없으면 아이콘만 표시된다 (라벨 빈 문자열)", () => {
    render(<BackButton label="" />);
    expect(document.querySelector("svg")).toBeInTheDocument();
    // 텍스트가 없어야 함 (버튼 내부는 아이콘만)
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("");
    expect(button).toHaveAttribute("aria-label", "뒤로 가기");
  });

  it("aria-label을 명시하면 해당 값을 우선 사용한다", () => {
    render(<BackButton label="" aria-label="뒤로" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "뒤로");
  });

  it("클릭 시 router.history.back()이 호출된다", () => {
    render(<BackButton />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it("custom onClick 핸들러가 있으면 router.history.back() 대신 호출된다", () => {
    const customClick = vi.fn();
    render(<BackButton onClick={customClick} />);

    fireEvent.click(screen.getByRole("button"));

    expect(customClick).toHaveBeenCalledTimes(1);
    expect(mockHistoryBack).not.toHaveBeenCalled();
  });
});
