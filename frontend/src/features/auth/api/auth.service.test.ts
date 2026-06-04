import { describe, expect, it } from 'vitest';
import { checkEmailDuplicate, loginEmail, registerEmail } from './auth.service';

describe('authService', () => {
  describe('registerEmail', () => {
    it('회원가입 요청 시 올바른 바디를 전송해야 한다', async () => {
      const signupData = {
        email: 'test@test.com',
        password: 'password123!',
        name: '테스터',
      };
      const response = await registerEmail(signupData);

      expect(response.accessToken).toContain('eyJhbGciOiJIUzI1NiJ9');
    });

    it('회원가입 실패 시 에러를 던져야 한다', async () => {
      const signupData = {
        email: 'error@test.com',
        password: 'password123!',
        name: '테스터',
      };
      await expect(registerEmail(signupData)).rejects.toThrow();
    });
  });

  describe('loginEmail', () => {
    it('로그인 요청 시 Basic Auth 헤더를 생성하여 전송해야 한다', async () => {
      const loginData = { email: 'test@test.com', password: 'password123!' };
      const response = await loginEmail(loginData.email, loginData.password);

      expect(response.accessToken).toContain('eyJhbGciOiJIUzI1NiJ9');
    });
  });

  describe('checkEmailDuplicate', () => {
    it('백엔드 이메일 확인 응답 메시지가 중복이면 duplicated true를 반환해야 한다', async () => {
      const response = await checkEmailDuplicate('duplicate@test.com');

      expect(response.duplicated).toBe(true);
    });

    it('백엔드 이메일 확인 응답 메시지가 사용 가능이면 duplicated false를 반환해야 한다', async () => {
      const response = await checkEmailDuplicate('new@test.com');

      expect(response.duplicated).toBe(false);
    });
  });
});
