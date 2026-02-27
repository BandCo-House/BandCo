import { createFileRoute, Outlet } from '@tanstack/react-router';
import { allowBandAccess } from '@/app/router-guards';

/**
 * 밴드 도메인의 부모 레이아웃 라우트.
 * 실제 헤더/탭 로직은 -band-header-utils로 분리해
 * 이 파일은 접근 가드와 Outlet 역할만 담당한다.
 */
export const Route = createFileRoute('/band/$bandId')({
  beforeLoad: allowBandAccess,
  component: Outlet,
});
