import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SVGIcon from './svg-icon';

describe('SVGIcon', () => {
  it('icon map에 있는 svg를 size 기준으로 렌더링한다', () => {
    const { container } = render(<SVGIcon icon="Bell" size="lg" />);
    const icon = container.querySelector('[data-slot="svg-icon"]');

    expect(icon).not.toBeNull();
    expect(icon).toHaveStyle({ width: '24px', height: '24px' });
  });
});
