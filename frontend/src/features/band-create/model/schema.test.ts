import { describe, expect, it } from 'vitest';
import { bandCreateSchema } from './schema';

describe('bandCreateSchema', () => {
  it('name이 비어있으면 에러를 반환한다', () => {
    const result = bandCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('name이 공백만 있으면 에러를 반환한다', () => {
    const result = bandCreateSchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('유효한 name은 parse에 성공한다', () => {
    const result = bandCreateSchema.safeParse({ name: '우리 밴드' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('우리 밴드');
    }
  });
});
