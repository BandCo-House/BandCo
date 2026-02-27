import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import type { HeaderTab } from './types';

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  brandLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
  meta?: string[];
  tabs?: HeaderTab[];
  rightActionLabel?: string;
  onRightActionClick?: () => void;
  rightContent?: ReactNode;
  className?: string;
};

/**
 * 라우트 레벨에서 공통으로 사용하는 표준 페이지 헤더
 */
export const PageHeader = ({
  title,
  subtitle,
  brandLabel,
  showBack = false,
  onBack,
  meta,
  tabs,
  rightActionLabel,
  onRightActionClick,
  rightContent,
  className,
}: PageHeaderProps) => {
  return (
    <header
      className={cn(
        'fixed inset-0 z-40 h-24 border-b border-border bg-background/90 backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-90rem items-center justify-between gap-6 px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            {showBack ? (
              <BackButton label="뒤로" variant="outline" className="text-sm" onClick={onBack} />
            ) : null}

            <div className="min-w-0">
              {brandLabel ? (
                <p className="mb-1 text-sm font-medium text-muted-foreground">{brandLabel}</p>
              ) : null}
              <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-1 text-base text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>

          {meta && meta.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-5">
          {tabs && tabs.length > 0 ? (
            <nav className="hidden items-center gap-2 md:flex">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant={tab.active ? 'default' : 'outline'}
                  className={cn(
                    'h-9 rounded-lg px-4 text-sm font-semibold',
                    tab.active
                      ? 'border-foreground bg-foreground text-background'
                      : 'bg-transparent text-foreground hover:bg-muted',
                  )}
                  onClick={tab.onClick}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
          ) : null}

          {rightActionLabel ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border border-border px-4 text-sm font-semibold"
              onClick={onRightActionClick}
            >
              {rightActionLabel}
            </Button>
          ) : null}

          {rightContent}
        </div>
      </div>
    </header>
  );
};
