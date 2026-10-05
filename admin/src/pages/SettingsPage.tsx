import { useState, type FormEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import { useIsSuperAdmin } from '@/features/auth/api';
import {
  APP_VERSION_PATTERN,
  MAINTENANCE_MESSAGE_MAX_LENGTH,
  useServiceSettings,
  useUpdateServiceSettings,
} from '@/features/service-settings/api';
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
} from '@/features/service-settings/types';
import { formatDateTime } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Checkbox, Field, Input, Textarea } from '@/shared/ui/Input';
import { ConfirmModal } from '@/shared/ui/Modal';
import { PageHeader } from '@/shared/ui/PageHeader';

interface SettingsFormProps {
  settings: ServiceSettings;
  readOnly: boolean;
}

const SettingsForm = ({ settings, readOnly }: SettingsFormProps) => {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(
    settings.maintenanceEnabled,
  );
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    settings.maintenanceMessage ?? '',
  );
  const [minAppVersion, setMinAppVersion] = useState(
    settings.minAppVersion ?? '',
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const updateSettings = useUpdateServiceSettings();

  const versionInvalid =
    minAppVersion.trim() !== '' &&
    !APP_VERSION_PATTERN.test(minAppVersion.trim());
  // 점검 모드를 새로 켜면 서비스 전체가 503이 되므로 한 번 더 확인한다.
  const turningOnMaintenance =
    maintenanceEnabled && !settings.maintenanceEnabled;

  const save = () => {
    const body: UpdateServiceSettingsRequest = {
      maintenanceEnabled,
      maintenanceMessage: maintenanceMessage.trim() || null,
      minAppVersion: minAppVersion.trim() || null,
    };
    updateSettings.mutate(body, {
      onSuccess: () => {
        toast.success('서비스 설정을 저장했습니다.');
        setConfirmOpen(false);
      },
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || versionInvalid) {
      return;
    }
    if (turningOnMaintenance) {
      setConfirmOpen(true);
      return;
    }
    save();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {readOnly && (
        <p className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
          운영자는 조회만 할 수 있습니다. 변경은 최고 관리자에게 요청하세요.
        </p>
      )}

      <Card title="점검 모드">
        <div className="space-y-4">
          {settings.maintenanceEnabled && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-700">
              <TriangleAlert className="size-4" aria-hidden />
              현재 점검 모드가 켜져 있습니다.
            </p>
          )}
          <Checkbox
            label="점검 모드 켜기 (어드민·서비스 상태·공지 API 외 모든 요청이 503)"
            checked={maintenanceEnabled}
            disabled={readOnly}
            onChange={(event) => setMaintenanceEnabled(event.target.checked)}
          />
          <Field
            label="점검 안내 문구"
            hint={`${maintenanceMessage.length} / ${MAINTENANCE_MESSAGE_MAX_LENGTH}자 · 비우면 기본 문구`}
          >
            <Textarea
              rows={3}
              value={maintenanceMessage}
              maxLength={MAINTENANCE_MESSAGE_MAX_LENGTH}
              disabled={readOnly}
              onChange={(event) => setMaintenanceMessage(event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card title="앱 버전">
        <Field
          label="최소 앱 버전"
          hint={
            versionInvalid ? (
              <span className="text-red-600">x.y.z 형식으로 입력하세요.</span>
            ) : (
              '서비스 앱(frontend/package.json의 version)이 이보다 낮으면 업데이트 화면으로 막습니다. 앱 버전을 먼저 올려 배포한 뒤 설정하세요. 비우면 제한 없음.'
            )
          }
        >
          <Input
            value={minAppVersion}
            placeholder="예: 1.2.0"
            disabled={readOnly}
            onChange={(event) => setMinAppVersion(event.target.value)}
            className="max-w-xs"
          />
        </Field>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          마지막 변경 {formatDateTime(settings.updatedAt)}
          {settings.updatedBy && ` · ${settings.updatedBy.name}`}
        </span>
        {!readOnly && (
          <Button
            type="submit"
            disabled={versionInvalid}
            loading={updateSettings.isPending}
          >
            저장
          </Button>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="점검 모드 켜기"
        description="저장하면 즉시(최대 10초 이내) 서비스 전체가 점검 상태가 됩니다. 계속할까요?"
        confirmLabel="점검 모드 켜기"
        danger
        loading={updateSettings.isPending}
        onConfirm={save}
        onClose={() => setConfirmOpen(false)}
      />
    </form>
  );
};

export const SettingsPage = () => {
  const { data, isPending, isError } = useServiceSettings();
  const isSuperAdmin = useIsSuperAdmin();

  const renderBody = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="서비스 설정을 불러오지 못했습니다." />;
    }
    // 저장 후 서버 값으로 폼을 다시 초기화한다.
    return (
      <SettingsForm
        key={data.updatedAt ?? 'default'}
        settings={data}
        readOnly={!isSuperAdmin}
      />
    );
  };

  return (
    <div>
      <PageHeader title="서비스 설정" />
      {renderBody()}
    </div>
  );
};
