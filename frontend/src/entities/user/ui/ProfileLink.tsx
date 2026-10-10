import { Link } from '@tanstack/react-router';
import ProfileIcon from '@/assets/icons/profile.svg?react';

type ProfileLinkProps = {
  userId: string;
  /** 스크린리더용 — 아이콘만 있는 링크라 누구의 프로필인지 이름으로 알린다. */
  nickname: string;
};

/**
 * 검색 결과 한 줄 끝의 프로필 이동 아이콘.
 *
 * 프로필은 `/profile?userId=` 한 라우트에서 방문자 모드로 연다.
 * `/profile/:userId` 경로는 없다 — 그쪽으로 보내면 조용히 아무 데도 가지 않는다.
 */
export const ProfileLink = ({ userId, nickname }: ProfileLinkProps) => (
  <Link
    to="/profile"
    search={{ userId }}
    aria-label={`${nickname} 프로필 보기`}
    className="flex shrink-0 items-center justify-center self-stretch rounded-full px-2 py-1.5 focus-visible:outline-2 focus-visible:outline-primary"
  >
    <ProfileIcon aria-hidden="true" />
  </Link>
);
