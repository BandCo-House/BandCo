import { http, HttpResponse } from "msw";

import { type ApiResponse, type TokenResponse } from "@/shared/api/types";

export const authHandlers = [
  // 이메일 회원가입
  http.post("*/auth/register/email", async ({ request }) => {
    const body = (await request.json()) as any;

    // 특정 이메일로 실패 케이스 테스트 가능
    if (body.email === "error@test.com") {
      return new HttpResponse(
        JSON.stringify({
          success: false,
          message: "이미 존재하는 이메일입니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return HttpResponse.json<ApiResponse<TokenResponse>>({
      success: true,
      data: {
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      },
    });
  }),

  // 이메일 로그인 (Basic Auth)
  http.post("*/auth/login/email", ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (authHeader?.startsWith("Basic ")) {
      return HttpResponse.json<ApiResponse<TokenResponse>>({
        success: true,
        data: {
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        },
      });
    }

    return new HttpResponse(
      JSON.stringify({
        success: false,
        message: "인증 정보가 올바르지 않습니다.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }),
];
