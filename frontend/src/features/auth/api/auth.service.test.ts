import { describe, it, expect, vi } from "vitest";
import { registerEmail, loginEmail } from "./auth.service";

// apiClient를 모킹하기 위해 임포트
import { apiClient } from "@/shared/api/client";

describe("authService", () => {
  describe("registerEmail", () => {
    it("회원가입 요청 시 올바른 바디를 전송해야 한다", async () => {
      const signupData = { email: "test@test.com", password: "password123!", name: "테스터" };
      const response = await registerEmail(signupData);

      expect(response.accessToken).toBe("mock-access-token");
    });

    it("회원가입 실패 시 에러를 던져야 한다", async () => {
      const signupData = { email: "error@test.com", password: "password123!", name: "테스터" };
      await expect(registerEmail(signupData)).rejects.toThrow();
    });
  });

  describe("loginEmail", () => {
    it("로그인 요청 시 Basic Auth 헤더를 생성하여 전송해야 한다", async () => {
      const loginData = { email: "test@test.com", password: "password123!" };
      const response = await loginEmail(loginData.email, loginData.password);

      expect(response.accessToken).toBe("mock-access-token");
    });
  });
});
