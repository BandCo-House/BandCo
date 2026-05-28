import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS, type NavItem } from '../nav-items';

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
