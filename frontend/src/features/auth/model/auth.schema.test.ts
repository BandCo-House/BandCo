import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from './auth.schema';

describe('authSchema', () => {
  describe('loginSchema (이메일 및 비밀번호 검증)', () => {
    it('올바른 이메일과 비밀번호 형식이면 성공해야 한다', () => {
      const validData = { email: 'test@example.com', password: 'password123!' };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('이메일 형식이 유효하지 않으면 실패해야 한다', () => {
      const invalidData = { email: 'invalid-email', password: 'password123' };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('비밀번호가 8자 미만이면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'pass12!',
      });
      expect(result.success).toBe(false);
    });

    it('비밀번호가 정확히 8자이면 성공해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'pass123!',
      });
      expect(result.success).toBe(true);
    });

    it('대문자로 구성된 비밀번호도 성공해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'PASSWORD1!',
      });
      expect(result.success).toBe(true);
    });

    it('비밀번호가 12자를 초과해도 성공해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'password123456!',
      });
      expect(result.success).toBe(true);
    });

    it('비밀번호에 숫자가 포함되지 않으면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'password!',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        '비밀번호에는 숫자를 1개 이상 포함해주세요.',
      );
    });

    it('비밀번호에 영문이 포함되지 않으면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: '12345678!',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        '비밀번호에는 영문을 1개 이상 포함해주세요.',
      );
    });

    it('비밀번호에 특수문자가 포함되지 않으면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'password123',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        '비밀번호에는 특수문자(!@#$%^&*())를 1개 이상 포함해주세요.',
      );
    });

    it('비밀번호에 한글이 포함되면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'pass123!한글',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        '비밀번호에는 영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다.',
      );
    });

    it('비밀번호에 허용되지 않은 특수문자가 포함되면 실패해야 한다', () => {
      const result = loginSchema.safeParse({
        email: 't@t.com',
        password: 'pass123!_',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema (이름 추가 검증)', () => {
    it('이름이 2자 이상이면 성공해야 한다', () => {
      const validData = {
        email: 'test@test.com',
        password: 'pass123!',
        nickname: '홍길동',
        handle: 'gildong',
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('이름이 없거나 2자 미만이면 실패해야 한다', () => {
      const result = signupSchema.safeParse({
        email: 't@t.com',
        password: 'pass123!',
        nickname: '김',
        handle: 'gildong',
      });
      expect(result.success).toBe(false);
    });

    it('이름은 코드 포인트 기준 20자까지 받는다', () => {
      const base = {
        email: 't@t.com',
        password: 'pass123!',
        handle: 'gildong',
      };
      // 이모지는 string.length로 2지만 백엔드는 1자로 센다.
      expect(
        signupSchema.safeParse({ ...base, nickname: '🎸'.repeat(20) }).success,
      ).toBe(true);
      expect(
        signupSchema.safeParse({ ...base, nickname: '가'.repeat(21) }).success,
      ).toBe(false);
    });

    it.each(['abc', 'abcdefghi', '한글아이디', 'dev-jun'])(
      '고유 ID "%s"는 형식 오류다',
      (handle) => {
        expect(
          signupSchema.safeParse({
            email: 't@t.com',
            password: 'pass123!',
            nickname: '홍길동',
            handle,
          }).success,
        ).toBe(false);
      },
    );
  });
});
