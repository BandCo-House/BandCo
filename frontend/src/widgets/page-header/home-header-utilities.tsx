import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Input } from '@/shared/ui/input';

type HomeHeaderUtilitiesProps = {
  showSearchBar?: boolean;
  showProfileAvatar?: boolean;
};

/**
 * 홈 헤더 우측 유틸 영역
 * 검색바/프로필 노출 여부를 라우트 헤더 설정으로 제어한다.
 */
export const HomeHeaderUtilities = ({
  showSearchBar = false,
  showProfileAvatar = true,
}: HomeHeaderUtilitiesProps) => {
  const [query, setQuery] = useState('');

  // TODO: 실제 API 응답값으로 교체 필요
  const profileNameFromApi = '김민';
  const profileImageUrlFromApi: string | undefined = undefined;

  const visibleComponents = [showSearchBar, showProfileAvatar].filter(Boolean).length;
  if (visibleComponents === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {showSearchBar ? (
        <Input
          isSearchBar
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="밴드/사용자를 찾아보세요"
          className="h-12"
        />
      ) : null}

      {showProfileAvatar ? (
        <Link
          to="/profile"
          type="button"
          aria-label="프로필 열기"
          className="rounded-full hover:opacity-90"
        >
          <Avatar size="lg" className="border border-red-200">
            {profileImageUrlFromApi ? (
              <AvatarImage src={profileImageUrlFromApi} alt={`${profileNameFromApi} 프로필`} />
            ) : null}
            <AvatarFallback>{profileNameFromApi.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </Link>
      ) : null}
    </div>
  );
};
