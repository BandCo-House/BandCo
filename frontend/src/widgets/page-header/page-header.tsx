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
        'fixed inset-x-0 top-0 z-40 bg-background/72 shadow-xl/5 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto grid min-h-24 w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 sm:gap-5">
        <div className="min-w-0 flex items-center gap-3 sm:gap-4">
          {!showBack ? (
            <span
              aria-hidden="true"
              className="size-11 shrink-0 rounded-xl bg-foreground"
            />
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center gap-3 sm:gap-4">
              {showBack ? (
                <BackButton
                  label="뒤로"
                  variant="ghost"
                  className="text-sm-sb"
                  onClick={onBack}
                />
              ) : null}

              <div className="min-w-0">
                {brandLabel ? (
                  <p className="mb-1 text-xs-sb text-muted">
                    {brandLabel}
                  </p>
                ) : null}
                <h1
                  className={cn(
                    'text-2xl truncate',
                    title === 'JamPlay' ? 'sr-only sm:not-sr-only' : undefined,
                  )}
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-base-r mt-1 text-muted">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {meta && meta.length > 0 ? (
              <div className="text-sm-m mt-4 flex flex-wrap items-center gap-4 text-muted">
                {meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0">{rightContent}</div>

        <div className="flex items-center justify-end gap-5">
          {tabs && tabs.length > 0 ? (
            <nav className="hidden items-center gap-2 md:flex">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  type="button"
                  variant={tab.active ? 'default' : 'outline'}
                  className={cn(
                    'text-sm-sb h-9 rounded-lg px-4',
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
              className="text-sm-sb h-9 rounded-lg border border-border px-4"
              onClick={onRightActionClick}
            >
              {rightActionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
