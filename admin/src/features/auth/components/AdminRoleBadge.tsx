import { Badge } from '@/shared/ui/Badge';

import { ADMIN_ROLE_LABELS, ADMIN_ROLE_TONES } from '../labels';
import type { AdminRole } from '../types';

export const AdminRoleBadge = ({ role }: { role: AdminRole }) => (
  <Badge tone={ADMIN_ROLE_TONES[role]}>{ADMIN_ROLE_LABELS[role]}</Badge>
);
