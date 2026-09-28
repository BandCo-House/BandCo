import { useParams } from '@tanstack/react-router';
import { useSchedulePoll } from '@/entities/schedule-poll/model/queries';

/**
 * 앱바에 투표 이름을 띄우는 타이틀 렌더러.
 *
 * 라우트 loader로 상세를 한 번 더 받으면 본문의 useSchedulePoll과 같은 요청이
 * 두 번 나간다(loader는 react-query 캐시 밖이다). 같은 쿼리를 구독해 캐시를
 * 공유하고, 도착 전에는 고정 라벨을 보여준다.
 */
export const SchedulePollHeaderTitle = () => {
  const { pollId = '' } = useParams({ strict: false });
  const { data: poll } = useSchedulePoll(pollId);

  return (
    <h1 className="min-w-0 truncate typo-lg-sb text-grey-50">
      {poll?.name ?? '일정 투표'}
    </h1>
  );
};
