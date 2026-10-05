import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  ADMIN_ROLE_LABELS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/features/auth/labels';
import type { AdminProfile, AdminRole } from '@/features/auth/types';
import { Button } from '@/shared/ui/Button';
import { Checkbox, Field, Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';
import { Select } from '@/shared/ui/Select';

import { useCreateAdmin, useResetAdminPassword, useUpdateAdmin } from '../api';

// 계약상 이름 길이 제한(1~50자)
const ADMIN_NAME_MAX_LENGTH = 50;

const ROLE_OPTIONS = (Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map(
  (role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }),
);

const PASSWORD_HINT = `${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자`;

const isValidPassword = (password: string): boolean =>
  password.length >= PASSWORD_MIN_LENGTH &&
  password.length <= PASSWORD_MAX_LENGTH;

interface FormFooterProps {
  formId: string;
  onClose: () => void;
  disabled: boolean;
  loading: boolean;
  submitLabel: string;
}

const FormFooter = ({
  formId,
  onClose,
  disabled,
  loading,
  submitLabel,
}: FormFooterProps) => (
  <>
    <Button variant="secondary" onClick={onClose}>
      취소
    </Button>
    <Button type="submit" form={formId} disabled={disabled} loading={loading}>
      {submitLabel}
    </Button>
  </>
);

export const CreateAdminModal = ({ onClose }: { onClose: () => void }) => {
  const formId = 'create-admin-form';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('OPERATOR');
  const createAdmin = useCreateAdmin();

  const canSubmit =
    email.trim().length > 0 &&
    name.trim().length > 0 &&
    isValidPassword(password);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    createAdmin.mutate(
      { email: email.trim(), name: name.trim(), password, role },
      {
        onSuccess: (admin) => {
          toast.success(`${admin.name} 계정을 만들었습니다.`);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title="어드민 계정 만들기"
      onClose={onClose}
      footer={
        <FormFooter
          formId={formId}
          onClose={onClose}
          disabled={!canSubmit}
          loading={createAdmin.isPending}
          submitLabel="만들기"
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3">
        <Field label="이메일">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="이름">
          <Input
            value={name}
            maxLength={ADMIN_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="초기 비밀번호" hint={PASSWORD_HINT}>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={PASSWORD_MAX_LENGTH}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="역할">
          <Select
            value={role}
            options={ROLE_OPTIONS}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          />
        </Field>
      </form>
    </Modal>
  );
};

interface EditAdminModalProps {
  admin: AdminProfile;
  isSelf: boolean;
  onClose: () => void;
}

export const EditAdminModal = ({
  admin,
  isSelf,
  onClose,
}: EditAdminModalProps) => {
  const formId = 'edit-admin-form';
  const [name, setName] = useState(admin.name);
  const [role, setRole] = useState<AdminRole>(admin.role);
  const [isActive, setIsActive] = useState(admin.isActive);
  const updateAdmin = useUpdateAdmin();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    updateAdmin.mutate(
      {
        adminId: admin.adminId,
        // 본인은 강등·비활성화할 수 없어 이름만 보낸다.
        body: isSelf
          ? { name: name.trim() }
          : { name: name.trim(), role, isActive },
      },
      {
        onSuccess: () => {
          toast.success('계정 정보를 수정했습니다.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={`${admin.name} 계정 수정`}
      onClose={onClose}
      footer={
        <FormFooter
          formId={formId}
          onClose={onClose}
          disabled={!name.trim()}
          loading={updateAdmin.isPending}
          submitLabel="저장"
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3">
        <Field label="이메일">
          <Input value={admin.email} disabled />
        </Field>
        <Field label="이름">
          <Input
            value={name}
            maxLength={ADMIN_NAME_MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label="역할"
          hint={isSelf ? '본인 계정의 역할은 바꿀 수 없습니다.' : undefined}
        >
          <Select
            value={role}
            options={ROLE_OPTIONS}
            disabled={isSelf}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          />
        </Field>
        <Checkbox
          label="활성 계정 (비활성 계정은 로그인할 수 없습니다)"
          checked={isActive}
          disabled={isSelf}
          onChange={(event) => setIsActive(event.target.checked)}
        />
      </form>
    </Modal>
  );
};

interface ResetPasswordModalProps {
  admin: AdminProfile;
  onClose: () => void;
}

export const ResetPasswordModal = ({
  admin,
  onClose,
}: ResetPasswordModalProps) => {
  const formId = 'reset-admin-password-form';
  const [newPassword, setNewPassword] = useState('');
  const resetPassword = useResetAdminPassword();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidPassword(newPassword)) {
      return;
    }
    resetPassword.mutate(
      { adminId: admin.adminId, body: { newPassword } },
      {
        onSuccess: () => {
          toast.success('비밀번호를 재설정했습니다. 새 비밀번호를 전달하세요.');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open
      title={`${admin.name} 비밀번호 재설정`}
      onClose={onClose}
      size="sm"
      footer={
        <FormFooter
          formId={formId}
          onClose={onClose}
          disabled={!isValidPassword(newPassword)}
          loading={resetPassword.isPending}
          submitLabel="재설정"
        />
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <Field label="새 비밀번호" hint={PASSWORD_HINT}>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            maxLength={PASSWORD_MAX_LENGTH}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
