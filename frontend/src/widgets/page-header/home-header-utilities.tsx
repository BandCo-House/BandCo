import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { SVGIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';

type HomeHeaderUtilitiesProps = {
  showSearchBar?: boolean;
  showProfileAvatar?: boolean;
  showNotificationTrigger?: boolean;
};

/**
 * 홈 헤더 우측 유틸 영역
 * 검색바/프로필 노출 여부를 라우트 헤더 설정으로 제어한다.
 */
export const HomeHeaderUtilities = ({
  showSearchBar = false,
  showProfileAvatar = true,
  showNotificationTrigger = false,
}: HomeHeaderUtilitiesProps) => {
  const [query, setQuery] = useState('');

  // TODO: 실제 API 응답값으로 교체 필요
  const profileNameFromApi = '김민';
  const profileImageUrlFromApi: string | undefined = undefined;

  const visibleComponents = [
    showSearchBar,
    showProfileAvatar,
    showNotificationTrigger,
  ].filter(Boolean).length;
  if (visibleComponents === 0) return null;

  return (
    <div
      className={
        showSearchBar
          ? 'flex min-w-0 items-center justify-between gap-4'
          : 'flex items-center justify-end gap-4'
      }
    >
      {showSearchBar ? (
        <Input
          isSearchBar
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="밴드/사용자를 찾아보세요"
          className="h-11 min-w-3xs max-w-96 rounded-full border border-border/90 bg-white/92 md:min-w-sm"
        />
      ) : null}

      {showNotificationTrigger || showProfileAvatar ? (
        <div className="flex shrink-0 items-center gap-3">
          {showNotificationTrigger ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="알림 열기"
              className="relative rounded-full text-foreground hover:bg-white/70"
            >
              <SVGIcon icon="Bell" size="md" />
              <span className="absolute -top-0.5 -right-0.5 inline-flex size-5 items-center justify-center rounded-md bg-secondary text-xs font-bold leading-none text-secondary-foreground">
                3
              </span>
            </Button>
          ) : null}

          {showNotificationTrigger && showProfileAvatar ? (
            <div aria-hidden="true" className="h-6 w-px bg-border/90" />
          ) : null}

          {showProfileAvatar ? (
            <Link
              to="/profile"
              aria-label="프로필 열기"
              className="rounded-full hover:opacity-90"
            >
              <Avatar
                size="lg"
                className="border border-white/80 bg-white"
              >
                {profileImageUrlFromApi ? (
                  <AvatarImage
                    src={profileImageUrlFromApi}
                    alt={`${profileNameFromApi} 프로필`}
                  />
                ) : null}
                <AvatarFallback>
                  {profileNameFromApi.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
