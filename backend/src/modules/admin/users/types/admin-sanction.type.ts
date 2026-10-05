import type { UserSanctionType } from 'src/generated/prisma';

/** 저장소에서 읽은 제재 한 건. isActive처럼 시각에 따라 달라지는 값은 Service가 계산한다. */
export type AdminSanctionRecord = {
  sanctionId: string;
  userId: string;
  type: UserSanctionType;
  reason: string;
  endsAt: Date | null;
  createdAt: Date;
  createdBy: { adminId: string; name: string };
  revokedAt: Date | null;
  revokedBy: { adminId: string; name: string } | null;
};

export type AdminSanction = {
  sanctionId: string;
  userId: string;
  type: UserSanctionType;
  reason: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { adminId: string; name: string };
  revokedAt: string | null;
  revokedBy: { adminId: string; name: string } | null;
};

export type CreateAdminSanctionInput = {
  type: UserSanctionType;
  reason: string;
  /** ISO 8601 문자열. SUSPENSION에서만 쓰며 없으면 영구 정지다. */
  endsAt?: string | null;
};

export type CreateAdminSanctionRecordInput = {
  userId: string;
  type: UserSanctionType;
  reason: string;
  endsAt: Date | null;
  createdByAdminId: string;
};
