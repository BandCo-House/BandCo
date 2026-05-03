import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("기본 렌더링: children이 표시된다", () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
  });

  it("isLoading=true이면 버튼이 disabled 상태가 된다", () => {
    render(<Button isLoading>저장</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("isLoading=true 기본값: Loader2 스피너 아이콘이 렌더링된다", () => {
    render(<Button isLoading>저장</Button>);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("isLoading=true + loadingContent(텍스트)이면 해당 텍스트가 표시된다", () => {
    render(
      <Button isLoading loadingContent="저장 중...">
        저장
      </Button>,
    );
    expect(screen.getByText("저장 중...")).toBeInTheDocument();
  });

  it("isLoading=true + loadingContent(JSX)이면 해당 컴포넌트가 표시된다", () => {
    render(
      <Button isLoading loadingContent={<span data-testid="custom-loading" />}>
        저장
      </Button>,
    );
    expect(screen.getByTestId("custom-loading")).toBeInTheDocument();
  });

  it("isLoading=true + loadingContent(텍스트)이면 원래 children은 표시되지 않는다", () => {
    render(
      <Button isLoading loadingContent="저장 중...">
        저장
      </Button>,
    );
    expect(screen.queryByText("저장")).not.toBeInTheDocument();
  });

  it("isLoading=false이면 children이 정상 표시된다", () => {
    render(<Button isLoading={false}>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("disabled prop이 true이면 disabled 상태가 된다", () => {
    render(<Button disabled>저장</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("외부 타이포그래피 유틸이 지정되면 기본 타이포그래피 유틸을 제거해야 한다", () => {
    render(<Button className="typo-lg-b">저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });

    expect(button).toHaveClass("typo-lg-b");
    expect(button).not.toHaveClass("typo-sm-sb");
  });

  it("secondary form 버튼은 로그인 제출 버튼 스타일을 제공해야 한다", () => {
    render(
      <Button variant="secondary" size="form" disabled>
        로그인
      </Button>,
    );

    const button = screen.getByRole("button", { name: "로그인" });

    expect(button).toHaveClass("typo-lg-b");
    expect(button).toHaveClass("bg-secondary");
    expect(button).toHaveClass("text-secondary-foreground");
    expect(button).toHaveClass("disabled:bg-grey-300");
    expect(button).toHaveClass("disabled:text-grey-500");
  });
});
