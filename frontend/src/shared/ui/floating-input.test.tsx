import { render, screen } from "@testing-library/react";
import { FloatingInput } from "./floating-input";
import { describe, it, expect } from "vitest";

describe("FloatingInput", () => {
  it("기본 상태에서 레이블은 투명(opacity-0)해야 한다", () => {
    render(<FloatingInput id="test-input" label="테스트 레이블" />);
    const label = screen.getByText("테스트 레이블");
    expect(label).toHaveClass("opacity-0");
  });

  it("포커스 시 레이블이 보이도록 그룹 상태 클래스가 있어야 한다", () => {
    render(<FloatingInput id="test-input" label="테스트 레이블" />);
    const label = screen.getByText("테스트 레이블");
    // group-focus-within:opacity-100 클래스를 가지고 있는지 확인
    expect(label).toHaveClass("group-focus-within:opacity-100");
  });
});
