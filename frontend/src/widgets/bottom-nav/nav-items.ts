import { Home, Search, TargetIcon, User } from 'lucide-react';
import type { ComponentType } from 'react';

export type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
};

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '홈', to: '/', icon: Home },
  { key: 'search', label: '검색', to: '/search', icon: Search },
  { key: 'my-bands', label: '내 밴드', to: '/my-bands', icon: TargetIcon },
  { key: 'my', label: '마이', to: '/profile', icon: User },
];
