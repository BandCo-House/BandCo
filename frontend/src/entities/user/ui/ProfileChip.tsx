import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

/**
 * Figma `profileUI`의 mode.
 *
 * - `basic`: 아바타 + 이름. 팀 카드처럼 여러 명을 줄바꿈으로 늘어놓는 자리
 * - `assigned`: `세션: 이름` 캡슐. 팀에서 맡은 자리를 사람 앞에 붙여 보여준다
 * - `full`: 이름 바로 뒤에 세션들. 멤버 카드 안에 들어가므로 자체 배경은 없다
 * - `search`: 캡슐 배경 + 고유 ID + 세션. 검색 결과 한 줄
 *
 * 시안의 hover·비공개 mode는 아직 없다 — hover는 프로필 미니 UI의 진입점인데 그 화면이 없고,
 * 비공개는 서버가 공개 여부를 내려주지 않는다.
 */
const profileChipVariants = cva('items-center', {
  variants: {
    variant: {
      basic: 'inline-flex gap-2',
      assigned:
        'inline-flex max-w-full gap-1.5 rounded-full bg-surface-2 py-1 pr-3 pl-3',
      full: 'flex min-w-0 flex-1 gap-2 rounded-full p-0.5',
      search:
        'flex min-w-0 flex-1 gap-2 rounded-md border border-surface-2 bg-surface-3 p-0.5 text-left transition-colors',
    },
    selected: {
      true: 'border-primary bg-surface-2',
      false: '',
    },
  },
  defaultVariants: { variant: 'basic', selected: false },
});

type ProfileChipProps = {
  nickname: string;
  avatarUrl?: string | null;
  /**
   * 세션 이름. `assigned`는 이름 앞에 `세션:`으로, `full`·`search`는 이름 뒤에 붙인다.
   * `basic`에서는 그리지 않는다.
   */
  sessionName?: string;
  /** 닉네임이 겹칠 때 사람을 가르는 고유 ID. `search`에서만 그린다. */
  handle?: string;
  className?: string;
} & VariantProps<typeof profileChipVariants>;

/**
 * 아바타·이름·세션을 한 줄로 보여주는 유저 표시.
 *
 * 화면마다 아바타 크기·글자 굵기·배경·세션 위치가 제각각이던 것을 한 곳으로 모았다.
 * 누르는 동작은 갖지 않는다 — 선택·이동은 감싸는 쪽이 `button`으로 준다.
 */
export const ProfileChip = ({
  nickname,
  avatarUrl,
  sessionName,
  handle,
  variant = 'basic',
  selected = false,
  className,
}: ProfileChipProps) => {
  const identity = (
    <>
      {/* 머릿글자는 이름과 같은 정보라 접근성 이름에 끼면 "김 김민준"이 된다. */}
      <Avatar aria-hidden="true">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>{nickname.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          'truncate typo-base-sb text-grey-50',
          // 줄바꿈 목록에서는 긴 이름 하나가 한 줄을 다 먹지 않게 폭을 묶는다.
          (variant === 'basic' || variant === 'assigned') && 'max-w-[68px]',
        )}
      >
        {nickname}
      </span>
    </>
  );
  const session = sessionName && (
    <span className="shrink-0 px-1.5 typo-xs-sb text-grey-200">
      {sessionName}
    </span>
  );

  if (variant === 'basic') {
    return (
      <span className={cn(profileChipVariants({ variant }), className)}>
        {identity}
      </span>
    );
  }

  if (variant === 'assigned') {
    return (
      <span className={cn(profileChipVariants({ variant }), className)}>
        {sessionName && (
          // 세션이 여러 개 붙어 길어지면 이쪽이 줄어든다 — 사람 이름이 잘리는 것보다 낫다.
          <span className="min-w-0 truncate typo-base-sb text-primary">
            {sessionName}:
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-2">
          {identity}
        </span>
      </span>
    );
  }

  return (
    <span className={cn(profileChipVariants({ variant, selected }), className)}>
      {/* 이름만 줄어든다 — 고유 ID와 세션은 잘리면 구분 단서가 사라진다.
          search는 이름이 남는 폭을 다 먹어 ID·세션을 오른쪽 끝으로 민다. */}
      <span
        className={cn(
          'flex min-w-0 items-center gap-2',
          variant === 'search' && 'flex-1',
        )}
      >
        {identity}
      </span>
      {variant === 'search' && handle && (
        <span className="shrink-0 typo-xs-r text-grey-100">{handle}</span>
      )}
      {session}
    </span>
  );
};
