import type { ReactNode } from 'react';
import { Inbox, Loader2 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <Inbox className="size-8 text-slate-300" aria-hidden />
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {description && <p className="text-xs text-slate-500">{description}</p>}
    {action}
  </div>
);

export const LoadingState = ({
  label = '불러오는 중…',
}: {
  label?: string;
}) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
    <Loader2 className="size-4 animate-spin" aria-hidden />
    {label}
  </div>
);
