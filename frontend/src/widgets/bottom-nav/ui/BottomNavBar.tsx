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
        'fixed bottom-0 z-40 w-full max-w-[648px] bg-gradient-top/60 footer-glow',
        'backdrop-blur-sm',
      )}
      style={{
        backgroundAttachment: 'fixed',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex h-18 items-center justify-around px-2">
        {items.map((item) => {
          const isActive =
            item.to === '/'
              ? pathname === '/'
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;

          return (
            <li key={item.key} className="flex-1">
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-3 transition-colors',
                  'hover:text-primary focus-visible:outline-2 focus-visible:outline-key',
                  isActive ? 'text-primary' : 'text-gray-300',
                )}
              >
                <Icon
                  aria-hidden={true}
                  className={cn('size-6 transition-transform duration-200')}
                />
                <span className="typo-xs-sb">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
