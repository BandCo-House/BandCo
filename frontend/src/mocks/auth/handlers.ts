import { http, HttpResponse } from 'msw';

import { type TokenResponse } from '@/shared/api/types';
import type { SignupReq } from '@/features/auth/model/auth.schema';

// payload: {"id":"user-001","email":"member@example.com","type":"access"}
// AuthProvider.getUserIdFromToken이 이 토큰에서 'user-001'을 파싱할 수 있어야 함
const MOCK_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9' +
  '.eyJpZCI6InVzZXItMDAxIiwiZW1haWwiOiJtZW1iZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoiYWNjZXNzIn0' +
  '.mock-signature';

// payload: {"id":"user-001","email":"member@example.com","type":"refresh","exp":4102444800} (2100년 만료)
const MOCK_REFRESH_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9' +
  '.eyJpZCI6InVzZXItMDAxIiwiZW1haWwiOiJtZW1iZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImV4cCI6NDEwMjQ0NDgwMH0' +
  '.mock-signature';

const mockTokenResponse: TokenResponse = {
  accessToken: MOCK_ACCESS_TOKEN,
  refreshToken: MOCK_REFRESH_TOKEN,
};

/**
 * 백엔드 ApiSuccessResponse envelope 형태의 토큰 발급 응답을 생성한다.
 */
const createTokenResponse = (message: string) => {
  return HttpResponse.json({
    status: 'success',
    error: null,
    message,
    data: mockTokenResponse,
  });
};

/**
 * 백엔드 auth 컨트롤러의 이메일 확인 성공 응답을 생성한다.
 */
const createEmailCheckResponse = (email: string, duplicated: boolean) => {
  return {
    status: 'success',
    error: null,
    message: duplicated
      ? '중복 된 이메일입니다.'
      : '사용할 수 있는 이메일입니다.',
    data: {
      email,
      duplicated,
    },
  };
};

/**
 * 백엔드 ApiExceptionFilter의 실패 봉투와 같은 형태의 응답을 생성한다.
 */
const createFailResponse = (
  statusCode: number,
  code: string,
  message: string,
) => {
  return HttpResponse.json(
    {
      status: 'fail',
      error: { code, details: { statusCode } },
      message,
      data: {},
    },
    { status: statusCode },
  );
};

const createUnauthorizedResponse = (message: string) =>
  createFailResponse(401, 'UNAUTHORIZED', message);

const extractBearerToken = (request: Request) => {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length);
};

export const authHandlers = [
  // 이메일 회원가입
  http.post('*/auth/register/email', async ({ request }) => {
    const body = (await request.json()) as SignupReq;

    // 특정 이메일로 실패 케이스 테스트 가능
    if (body.email === 'error@test.com') {
      return createFailResponse(
        400,
        'BAD_REQUEST',
        '이미 존재하는 이메일입니다.',
      );
    }

    return createTokenResponse('회원가입 성공');
  }),

  http.post('*/auth/email', async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    const duplicated = body.email === 'duplicate@test.com';

    return HttpResponse.json(
      createEmailCheckResponse(body.email ?? '', duplicated),
    );
  }),

  http.post('*/auth/token/access', ({ request }) => {
    const token = extractBearerToken(request);

    if (!token) {
      return createUnauthorizedResponse(
        '길이 또는 prefix가 잘못된 토큰 형식입니다.',
      );
    }

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '액세스 토큰 재발급 성공',
      data: { accessToken: 'mock-rotated-access-token' },
    });
  }),

  http.post('*/auth/token/refresh', ({ request }) => {
    const token = extractBearerToken(request);

    if (!token) {
      return createUnauthorizedResponse(
        '길이 또는 prefix가 잘못된 토큰 형식입니다.',
      );
    }

    // payload: {"id":"user-001","email":"member@example.com","type":"refresh","exp":4102444800} (2100년 만료)
    const mockRotatedRefreshToken =
      'eyJhbGciOiJIUzI1NiJ9' +
      '.eyJpZCI6InVzZXItMDAxIiwiZW1haWwiOiJtZW1iZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoicmVmcmVzaCIsImV4cCI6NDEwMjQ0NDgwMH0' +
      '.mock-signature';

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '리프레시 토큰 재발급 성공',
      data: { refreshToken: mockRotatedRefreshToken },
    });
  }),

  // 이메일 로그인 (Basic Auth)
  http.post('*/auth/login/email', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Basic ')) {
      return createTokenResponse('로그인 성공');
    }

    return createUnauthorizedResponse(
      '길이 또는 prefix가 잘못된 토큰 형식입니다.',
    );
  }),

  // Google 로그인 (ID 토큰) — 백엔드 ApiSuccessResponse envelope 형태로 응답한다.
  http.post('*/auth/login/google', async ({ request }) => {
    const body = (await request.json()) as { idToken?: string };

    if (!body.idToken) {
      return createFailResponse(400, 'BAD_REQUEST', 'idToken must be a string');
    }

    return createTokenResponse('로그인 성공');
  }),
];
