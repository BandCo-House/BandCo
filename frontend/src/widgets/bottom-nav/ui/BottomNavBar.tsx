import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Search, Music2, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ComponentType } from 'react';

export type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '홈', to: '/', icon: Home },
  { key: 'search', label: '검색', to: '/search', icon: Search },
  { key: 'my-bands', label: '내 밴드', to: '/my-bands', icon: Music2 },
  { key: 'my', label: '마이', to: '/profile', icon: User },
];

type BottomNavBarProps = {
  items?: NavItem[];
};

export function BottomNavBar({ items = NAV_ITEMS }: BottomNavBarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="하단 네비게이션"
      className={cn(
        'fixed bottom-0 z-50 w-full max-w-[648px]',
        'border-t border-border backdrop-blur-sm',
      )}
      style={{
        background:
          'linear-gradient(135deg, var(--gradient-top) 0%, var(--gradient-bottom) 100%)',
        backgroundAttachment: 'fixed',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive = pathname === item.to;
          const Icon = item.icon;

          return (
            <li key={item.key} className="flex-1">
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors',
                  'hover:bg-overlay-24 focus-visible:outline-2 focus-visible:outline-key',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon
                  aria-hidden={true}
                  className={cn(
                    'size-6 transition-transform duration-200',
                    isActive && 'scale-110',
                  )}
                />
                <span
                  className={cn(
                    'transition-colors',
                    isActive ? 'typo-xs-sb' : 'typo-xs-r',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
