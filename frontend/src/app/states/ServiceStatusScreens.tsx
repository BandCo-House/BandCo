import { Button } from '@/shared/ui/button';
import { Logo } from '@/shared/ui/logo';

const DEFAULT_MAINTENANCE_MESSAGE =
  '서비스 점검 중입니다. 잠시 후 다시 이용해 주세요.';

interface FullScreenNoticeProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  isActionDisabled?: boolean;
}

/**
 * 라우터 대신 화면 전체를 차지하는 안내. 배경은 html의 앱 그라데이션을 그대로 쓴다.
 * 레이아웃(RootLayout) 밖에서 렌더되므로 safe area를 직접 비운다.
 */
const FullScreenNotice = ({
  title,
  description,
  actionLabel,
  onAction,
  isActionDisabled = false,
}: FullScreenNoticeProps) => (
  <main className="mx-auto flex min-h-dvh w-full max-w-[648px] flex-col items-center justify-center gap-8 px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center">
    <Logo decorative />
    <div className="flex flex-col gap-3">
      <h1 className="typo-xl-sb text-grey-50">{title}</h1>
      <p className="typo-sm-r break-words whitespace-pre-line text-grey-200">
        {description}
      </p>
    </div>
    <Button
      type="button"
      variant="shining"
      size="lg"
      onClick={onAction}
      disabled={isActionDisabled}
    >
      {actionLabel}
    </Button>
  </main>
);

interface MaintenanceScreenProps {
  message: string | null;
  onRetry: () => void;
  isRetrying: boolean;
}

export const MaintenanceScreen = ({
  message,
  onRetry,
  isRetrying,
}: MaintenanceScreenProps) => (
  <FullScreenNotice
    title="서비스 점검 중"
    description={message?.trim() || DEFAULT_MAINTENANCE_MESSAGE}
    actionLabel="다시 확인"
    onAction={onRetry}
    isActionDisabled={isRetrying}
  />
);

export const UpdateRequiredScreen = () => (
  <FullScreenNotice
    title="업데이트가 필요해요"
    description={
      '새 버전이 나왔어요.\n새로고침해서 최신 버전으로 이용해 주세요.'
    }
    actionLabel="새로고침"
    onAction={() => window.location.reload()}
  />
);
