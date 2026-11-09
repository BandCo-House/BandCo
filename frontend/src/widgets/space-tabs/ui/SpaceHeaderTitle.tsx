import { useParams } from '@tanstack/react-router';
import { useSpace } from '@/entities/space/api/useSpace';

/**
 * 합주 화면 앱바 제목. 고정 라벨("내 합주") 대신 합주 공간 이름과 설명을 보여준다.
 * 이름·설명이 앱바로 올라와서, 캘린더 위에 따로 두던 요약 블록은 없앤다.
 *
 * 본문과 같은 useSpace를 구독해 요청을 한 번만 보낸다. 도착 전에는 고정 라벨을 둔다.
 */
export const SpaceHeaderTitle = () => {
  const { spaceId = '' } = useParams({ strict: false });
  const { data: spaceDetail } = useSpace(spaceId);
  const name = spaceDetail?.space.name ?? '합주 공간';
  const description = spaceDetail?.space.description;

  return (
    <div className="flex min-w-0 flex-col">
      <h1 className="truncate typo-lg-sb text-grey-50">{name}</h1>
      {description ? (
        <p className="truncate typo-sm-r text-grey-300">{description}</p>
      ) : null}
    </div>
  );
};
