import { Link, Outlet, useMatches, useRouter } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  PageHeader,
  type RouteStaticData,
  resolveHeader,
} from '@/widgets/page-header';

export const RootLayout = () => {
  const router = useRouter();
  const matches = useMatches();
  const activeMatch = matches.at(-1);
  const currentParams = (activeMatch?.params ?? {}) as Record<string, string>;

  const header = resolveHeader(
    activeMatch?.staticData as RouteStaticData | undefined,
    {
      params: currentParams,
      loaderData: activeMatch?.loaderData,
    },
  );

  const onBack = header?.showBack
    ? () => {
        if (header.backBehavior === 'browser') {
          router.history.back();
          return;
        }

        if (header.backTo) {
          const backParams = header.getBackParams?.(currentParams);
          router.navigate({
            to: header.backTo as never,
            ...(backParams ? { params: backParams as never } : {}),
          });
          return;
        }

        router.history.back();
      }
    : undefined;

  const rightContent = (() => {
    if (!header) return undefined;

    const tabs = header.tabs?.map((tab) => {
      const tabTo = tab.getTo?.(currentParams) ?? tab.to;
      const [tabPath, tabSearchString] = tabTo?.split('?') ?? [];
      const tabSearch = tabSearchString
        ? Object.fromEntries(new URLSearchParams(tabSearchString))
        : undefined;
      const tabParams = tab.getParams?.(currentParams);
      const isActive =
        tab.active ??
        tab.isActive?.({
          pathname: router.state.location.pathname,
          params: currentParams,
        }) ??
        false;
      const tabButton = (
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          data-variant={isActive ? 'default' : 'outline'}
          onClick={tab.onClick}
        >
          {tab.label}
        </Button>
      );

      return tabPath ? (
        <Link
          key={tab.key}
          to={tabPath as never}
          {...(tabParams ? { params: tabParams as never } : {})}
          {...(tabSearch ? { search: tabSearch as never } : {})}
        >
          {tabButton}
        </Link>
      ) : (
        <span key={tab.key}>{tabButton}</span>
      );
    });

    const rightActionParams = header.getRightActionParams?.(currentParams);
    const rightAction =
      header.rightActionLabel && header.rightActionTo ? (
        <Link
          to={header.rightActionTo as never}
          {...(rightActionParams ? { params: rightActionParams as never } : {})}
        >
          <Button type="button" variant="outline" size="sm">
            {header.rightActionLabel}
          </Button>
        </Link>
      ) : null;

    if (!tabs?.length && !rightAction) return undefined;

    return (
      <div className="flex items-center gap-2">
        {tabs}
        {rightAction}
      </div>
    );
  })();

  const pageHeaderProps = header
    ? {
        title: header.title ?? '',
        showBack: header.showBack,
        rightContent,
      }
    : null;

  return (
    <div className="mx-auto flex h-dvh min-h-0 max-w-[648px] flex-col overflow-hidden">
      {pageHeaderProps ? (
        <PageHeader {...pageHeaderProps} onBack={onBack} />
      ) : null}
      <main
        className={cn(
          'mx-auto min-h-0 w-full flex-1',
          pageHeaderProps ? undefined : 'min-h-screen',
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
