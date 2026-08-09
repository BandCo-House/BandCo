import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentItem } from './attachment-item';

describe('AttachmentItem', () => {
  it('href가 없으면 이름만 표시하고 링크로 만들지 않는다', () => {
    render(<AttachmentItem name="123qwert.png" />);

    expect(screen.getByText('123qwert.png')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('href가 있으면 제목과 주소를 함께 보여주고 새 탭 링크가 된다', () => {
    const href = 'https://bandco.atlassian.net/jira/software/projects/KAN';
    render(<AttachmentItem name="BandCo JIRA" href={href} />);

    const link = screen.getByRole('link', { name: /BandCo JIRA/ });
    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(href)).toBeInTheDocument();
  });

  it('iconUrl을 주면 썸네일 이미지를 장식 요소로 렌더링한다', () => {
    const { container } = render(
      <AttachmentItem
        name="123qwert.png"
        iconUrl="https://cdn.test/favicon.ico"
      />,
    );

    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://cdn.test/favicon.ico');
    expect(image).toHaveAttribute('aria-hidden', 'true');
  });

  it('onRemove를 주면 삭제 버튼이 링크 밖 형제로 렌더링된다', () => {
    const onRemove = vi.fn();
    render(
      <AttachmentItem
        name="BandCo JIRA"
        href="https://bandco.atlassian.net"
        onRemove={onRemove}
      />,
    );

    const removeButton = screen.getByRole('button', {
      name: 'BandCo JIRA 첨부 삭제',
    });
    // <a> 안에 <button>이 들어가면 HTML 규격 위반이라 중첩되면 안 된다.
    expect(removeButton.closest('a')).toBeNull();

    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
