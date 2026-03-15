import Add from '@/assets/icons/add.svg?react';
import AddWithCircle from '@/assets/icons/add-with-circle.svg?react';
import ArrowRight from '@/assets/icons/arrow-right.svg?react';
import Bell from '@/assets/icons/bell.svg?react';
import Calendar from '@/assets/icons/calendar.svg?react';
import Check from '@/assets/icons/check.svg?react';
import Copy from '@/assets/icons/copy.svg?react';
import Invite from '@/assets/icons/invite.svg?react';
import Link from '@/assets/icons/link.svg?react';
import Member from '@/assets/icons/member.svg?react';
import Setting from '@/assets/icons/setting.svg?react';
import Withdraw from '@/assets/icons/withdraw.svg?react';

export const IconMap = {
  Add,
  AddWithCircle,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  Copy,
  Invite,
  Link,
  Member,
  Setting,
  Withdraw,
} as const;

export type IconMapTypes = keyof typeof IconMap;

export const IconSizes = {
  xl: 36,
  lg: 24,
  md: 20,
  sm: 16,
  xs: 12,
} as const;

export type IconSizeTypes = keyof typeof IconSizes;
