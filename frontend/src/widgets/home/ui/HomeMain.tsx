import { Link } from '@tanstack/react-router';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { ComingSoon } from '@/shared/ui/coming-soon';

const SHORTCUTS = [
  { to: '/my-bands', label: '내 밴드 목록보기' },
  { to: '/profile', label: '마이페이지 확인하기' },
] as const;

/** 홈(MVP). 주요 화면 바로가기 카드 + 준비 중 안내. */
export const HomeMain = () => (
  <div data-testid="home-page" className="flex flex-col gap-4">
    {SHORTCUTS.map((shortcut) => (
      <Link
        key={shortcut.to}
        to={shortcut.to}
        className="relative flex h-[120px] overflow-hidden rounded-md bg-surface-1 p-5 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="typo-lg-sb text-grey-50">{shortcut.label}</span>
        <ArrowRightIcon
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 size-16 text-grey-50 opacity-40"
        />
      </Link>
    ))}

    <ComingSoon
      className="whitespace-pre-line"
      message={'소셜 네트워킹 서비스\n준비중입니다'}
    />
  </div>
);
