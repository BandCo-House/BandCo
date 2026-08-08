import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './field';
import { Input } from './input';

describe('Field required 전달', () => {
  it('required Field 안의 입력은 aria-required를 자동으로 갖는다', () => {
    render(
      <Field label="이름" required htmlFor="name">
        <Input id="name" aria-label="이름" />
      </Field>,
    );

    expect(screen.getByLabelText('이름')).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('required가 아니면 aria-required를 붙이지 않는다', () => {
    render(
      <Field label="메모" htmlFor="memo">
        <Input id="memo" aria-label="메모" />
      </Field>,
    );

    expect(screen.getByLabelText('메모')).not.toHaveAttribute('aria-required');
  });

  it('명시적으로 넘긴 aria-required는 그대로 존중한다', () => {
    render(
      <Field label="이름" htmlFor="name">
        <Input id="name" aria-label="이름" aria-required />
      </Field>,
    );

    expect(screen.getByLabelText('이름')).toHaveAttribute(
      'aria-required',
      'true',
    );
  });
});
