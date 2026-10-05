import { useState } from 'react';
import { Plus } from 'lucide-react';

import { useAdmins } from '@/features/admins/api';
import {
  CreateAdminModal,
  EditAdminModal,
  ResetPasswordModal,
} from '@/features/admins/components/AdminFormModals';
import { useCurrentAdmin } from '@/features/auth/api';
import { AdminRoleBadge } from '@/features/auth/components/AdminRoleBadge';
import { RequireSuperAdmin } from '@/features/auth/components/RequireSuperAdmin';
import type { AdminProfile } from '@/features/auth/types';
import { formatDateTime } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; admin: AdminProfile }
  | { type: 'password'; admin: AdminProfile }
  | null;

const AdminList = () => {
  const { data, isPending, isError } = useAdmins();
  const { data: me } = useCurrentAdmin();
  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = () => setModal(null);

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="어드민 계정을 불러오지 못했습니다." />;
    }
    if (data.admins.length === 0) {
      return <EmptyState title="어드민 계정이 없습니다." />;
    }

    return (
      <Table>
        <THead>
          <tr>
            <Th>이름</Th>
            <Th>이메일</Th>
            <Th>역할</Th>
            <Th>상태</Th>
            <Th>최근 로그인</Th>
            <Th>생성일</Th>
            <Th />
          </tr>
        </THead>
        <TBody>
          {data.admins.map((admin) => (
            <Tr key={admin.adminId}>
              <Td className="font-medium text-slate-900">
                {admin.name}
                {admin.adminId === me?.adminId && (
                  <span className="ml-1.5 text-xs text-slate-400">(나)</span>
                )}
              </Td>
              <Td>{admin.email}</Td>
              <Td>
                <AdminRoleBadge role={admin.role} />
              </Td>
              <Td>
                {admin.isActive ? (
                  <Badge tone="green">활성</Badge>
                ) : (
                  <Badge>비활성</Badge>
                )}
              </Td>
              <Td>{formatDateTime(admin.lastLoginAt)}</Td>
              <Td>{formatDateTime(admin.createdAt)}</Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setModal({ type: 'edit', admin })}
                  >
                    수정
                  </Button>
                  {/* 본인 비밀번호는 서버가 막는다. 상단의 "비밀번호 변경"을 쓴다. */}
                  {admin.adminId !== me?.adminId && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setModal({ type: 'password', admin })}
                    >
                      비밀번호 재설정
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    );
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setModal({ type: 'create' })}>
          <Plus className="size-4" aria-hidden />새 계정
        </Button>
      </div>
      <Card bodyClassName="p-0">{renderTable()}</Card>

      {modal?.type === 'create' && <CreateAdminModal onClose={closeModal} />}
      {modal?.type === 'edit' && (
        <EditAdminModal
          admin={modal.admin}
          isSelf={modal.admin.adminId === me?.adminId}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'password' && (
        <ResetPasswordModal admin={modal.admin} onClose={closeModal} />
      )}
    </>
  );
};

export const AdminsPage = () => (
  <div>
    <PageHeader
      title="어드민 계정"
      description="어드민 계정은 서비스 회원과 별개입니다."
    />
    <RequireSuperAdmin>
      <AdminList />
    </RequireSuperAdmin>
  </div>
);
