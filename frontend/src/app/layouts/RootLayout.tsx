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

  const pageHeaderProps = header
    ? {
        title: header.title ?? '',
        showBack: header.showBack,
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
        <PageHeader {...pageHeaderProps} onBack={onBack} />
      ) : null}
      <main
        className={cn(
          'mx-auto w-full max-w-5xl px-6 py-8',
          pageHeaderProps ? 'pt-24 md:pt-40' : undefined,
        )}
      >
        <Outlet />
      </main>
    </div>
  );
};
