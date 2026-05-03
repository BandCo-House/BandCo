import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "./auth.schema";

describe("authSchema", () => {
  describe("loginSchema (이메일 및 비밀번호 검증)", () => {
    it("올바른 이메일과 비밀번호 형식이면 성공해야 한다", () => {
      const validData = { email: "test@example.com", password: "password123!" };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("이메일 형식이 유효하지 않으면 실패해야 한다", () => {
      const invalidData = { email: "invalid-email", password: "password123" };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("비밀번호가 6자 미만이면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "pass1" });
      expect(result.success).toBe(false);
    });

    it("비밀번호가 12자를 초과하면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "password123456" });
      expect(result.success).toBe(false);
    });

    it("비밀번호에 숫자가 포함되지 않으면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "password" });
      expect(result.success).toBe(false);
    });

    it("비밀번호에 영문이 포함되지 않으면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "123456" });
      expect(result.success).toBe(false);
    });

    it("비밀번호에 한글이 포함되면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "pass12한글" });
      expect(result.success).toBe(false);
    });

    it("비밀번호에 허용되지 않은 특수문자가 포함되면 실패해야 한다", () => {
      const result = loginSchema.safeParse({ email: "t@t.com", password: "pass12_" });
      expect(result.success).toBe(false);
    });
  });

  describe("signupSchema (이름 추가 검증)", () => {
    it("이름이 2자 이상이면 성공해야 한다", () => {
      const validData = { email: "test@test.com", password: "pass123!", name: "홍길동" };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("이름이 없거나 2자 미만이면 실패해야 한다", () => {
      const result = signupSchema.safeParse({ email: "t@t.com", password: "pass123!", name: "김" });
      expect(result.success).toBe(false);
    });
  });
});
