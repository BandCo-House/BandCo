import { SVGIcon } from '@/shared/ui/icon';
import { cn } from '@/shared/lib/utils';

interface ActionFabProps {
  /** 버튼에 보이는 글자. 무엇을 만드는지 누르기 전에 알 수 있어야 한다. */
  label: string;
  onClick: () => void;
  /** 바깥 컨테이너 위치/여백 override (예: bottom 위치 조정) */
  className?: string;
  /**
   * 다이얼로그·시트가 열려 있는 동안 true. 오버레이가 반투명이라 z-40 FAB이
   * 그대로 비쳐 보이고, 패널에 가려 아랫부분만 삐져나와 버튼이 흘러내린 것처럼
   * 보인다. 그동안은 아예 렌더하지 않는다.
   */
  hidden?: boolean;
}

const CONTAINER_BASE =
  'pointer-events-none fixed inset-x-0 bottom-[140px] z-40 mx-auto flex w-full max-w-[648px] justify-end px-6';

/**
 * 화면의 주 행동 하나를 바로 실행하는 FAB.
 * 메뉴를 펼치는 방식은 UT에서 "메뉴를 먼저 열어야 해서 직관적이지 않다"는
 * 지적을 받아, 버튼 하나에 행동 하나와 글자를 두는 방식으로 바꿨다.
 */
export const ActionFab = ({
  label,
  onClick,
  className,
  hidden = false,
}: ActionFabProps) => {
  if (hidden) return null;

  return (
    <div className={cn(CONTAINER_BASE, className)}>
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto flex h-14 items-center gap-1.5 rounded-full bg-primary pr-5 pl-4 typo-base-sb text-gradient-top shadow-drop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <SVGIcon icon="Add" size="md" />
        {label}
      </button>
    </div>
  );
};
