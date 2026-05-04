import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('roundedFull variant가 지정되면 입력 필드는 둥근 테두리와 key focus 스타일을 가져야 한다', () => {
    render(<Input aria-label="이메일" variant="roundedFull" />);

    const input = screen.getByLabelText('이메일');

    expect(input).toHaveClass('rounded-full');
    expect(input).toHaveClass('outline-solid');
    expect(input).toHaveClass('outline-transparent');
    expect(input).toHaveClass('hover:outline-key');
    expect(input).toHaveClass('focus-visible:outline-key');
    expect(input).not.toHaveClass('outline-none');
  });

  it('underline variant가 지정되면 입력 필드는 밑줄 테두리와 key focus 스타일을 가져야 한다', () => {
    render(<Input aria-label="이름" variant="underline" />);

    const input = screen.getByLabelText('이름');

    expect(input).toHaveClass('rounded-none');
    expect(input).toHaveClass('border-b');
    expect(input).toHaveClass('outline-none');
    expect(input).toHaveClass('hover:border-key');
    expect(input).toHaveClass('focus-visible:border-key');
  });
});
