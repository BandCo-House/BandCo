import { Outlet, useMatches, useRouter } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import {
  HomeHeaderUtilities,
  PageHeader,
  type RouteStaticData,
  resolveHeader,
} from '@/widgets/page-header';

export const RootLayout = () => {
  const router = useRouter();
  const matches = useMatches();
  const activeMatch = matches.at(-1);
  const currentPathname = router.state.location.pathname;
  const currentParams = (activeMatch?.params ?? {}) as Record<string, string>;

  const header = resolveHeader(activeMatch?.staticData as RouteStaticData | undefined, {
    params: currentParams,
    loaderData: activeMatch?.loaderData,
  });

  const onRightActionClick = header?.rightActionTo
    ? () => {
        const params = header.getRightActionParams?.(
          currentParams,
        );

        router.navigate({
          to: header.rightActionTo as never,
          ...(params ? { params: params as never } : {}),
        });
      }
    : undefined;

  const resolvedTabs = header?.tabs?.map((tab) => {
    const tabTo = tab.getTo?.(currentParams) ?? tab.to;
    const tabParams = tab.getParams?.(currentParams);
    const tabOnClick = tabTo
      ? () => {
          const [tabPath, tabQuery] = tabTo.split('?');
          const tabSearch = tabQuery
            ? Object.fromEntries(new URLSearchParams(tabQuery).entries())
            : undefined;

          router.navigate({
            to: tabPath as never,
            ...(tabParams ? { params: tabParams as never } : {}),
            ...(tabSearch ? { search: tabSearch as never } : {}),
          });
        }
      : tab.onClick;

    const isActiveByMatcher = tab.isActive?.({
      pathname: currentPathname,
      params: currentParams,
    });
    const isActiveByPath = tab.activePathPrefixes
      ? tab.activePathPrefixes.some((prefix) => currentPathname.startsWith(prefix))
      : undefined;

    return {
      ...tab,
      active: isActiveByMatcher ?? isActiveByPath ?? tab.active,
      onClick: tabOnClick,
    };
  });

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

  const pageHeaderProps = header
    ? {
        title: header.title ?? '',
        subtitle: header.subtitle,
        brandLabel: header.brandLabel,
        showBack: header.showBack,
        meta: header.meta,
        tabs: resolvedTabs,
        rightActionLabel: header.rightActionLabel,
        rightContent: header.showUtilities ? (
          <HomeHeaderUtilities
            showSearchBar={header.showSearchBar}
            showProfileAvatar={header.showProfileAvatar}
            showNotificationTrigger={header.showNotificationTrigger}
          />
        ) : undefined,
      }
    : null;

  return (
    <div className="min-h-screen">
      {pageHeaderProps ? (
        <PageHeader
          {...pageHeaderProps}
          onBack={onBack}
          onRightActionClick={onRightActionClick}
        />
      ) : null}
      <main
        className={cn(
          'mx-auto w-full max-w-90rem px-6 py-8',
          pageHeaderProps ? 'pt-[calc(8rem+2rem)]' : undefined,
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};
