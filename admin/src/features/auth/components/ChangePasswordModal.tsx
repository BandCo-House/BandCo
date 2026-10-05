import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/Button';
import { Field, Input } from '@/shared/ui/Input';
import { Modal } from '@/shared/ui/Modal';

import { useChangeMyPassword } from '../api';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../labels';

const FORM_ID = 'change-password-form';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({
  open,
  onClose,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const changePassword = useChangeMyPassword();

  const mismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= PASSWORD_MIN_LENGTH &&
    newPassword === confirmPassword;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('비밀번호를 변경했습니다.');
          handleClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title="비밀번호 변경"
      onClose={handleClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={!canSubmit}
            loading={changePassword.isPending}
          >
            변경
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-3">
        <Field label="현재 비밀번호">
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>
        <Field
          label="새 비밀번호"
          hint={`${PASSWORD_MIN_LENGTH}~${PASSWORD_MAX_LENGTH}자`}
        >
          <Input
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        <Field
          label="새 비밀번호 확인"
          hint={mismatch ? '새 비밀번호와 일치하지 않습니다.' : undefined}
        >
          <Input
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
