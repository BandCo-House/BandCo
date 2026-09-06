import { Link } from '@tanstack/react-router';
import { useBandNotices } from '@/entities/notice/api/useBandNotices';

// 공지는 보조 정보: 실패해도 이 블록만 대체 문구로 표시하고, 최신 N개만 노출한다.
const NOTICE_LIMIT = 2;

const formatNoticeDate = (iso: string): string => {
  // ISO의 날짜 부분을 타임존 영향 없이 표시하기 위해 UTC 기준으로 읽는다.
  const date = new Date(iso);
  const year = String(date.getUTCFullYear()).slice(2);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

interface BandNoticeSectionProps {
  bandId: string;
}

export const BandNoticeSection = ({ bandId }: BandNoticeSectionProps) => {
  const {
    data: notices,
    isLoading,
    isError,
  } = useBandNotices(bandId, NOTICE_LIMIT);

  const renderBody = () => {
    if (isLoading) {
      return <p className="typo-sm-r text-grey-300">불러오는 중...</p>;
    }
    // 실패도 빈 목록과 같이 취급한다.
    // GET /bands/:bandId/notices는 백엔드에 아직 없어(Nest 라우트 미등록 → 404)
    // 모든 밴드에서 항상 실패한다. 에러 문구를 띄우면 밴드 홈마다 붉은 신호가
    // 상주하게 되는데, 정작 사용자가 할 수 있는 일이 없다.
    // 엔드포인트가 생기면 isError를 다시 갈라 실제 실패를 구분한다.
    if (isError || !notices || notices.length === 0) {
      return <p className="typo-sm-r text-grey-300">공지사항이 없습니다.</p>;
    }
    return (
      <ul className="-mx-2 flex flex-col">
        {notices.map((notice) => (
          <li key={notice.id}>
            <Link
              to="/band/$bandId/notices/$noticeId"
              params={{ bandId, noticeId: notice.id }}
              className="flex items-center gap-6 px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate typo-sm-r text-grey-200">
                {notice.content}
              </span>
              <span className="shrink-0 typo-sm-r text-grey-300">
                {formatNoticeDate(notice.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="typo-base-sb text-grey-100">밴드 공지</h2>
        <Link
          to="/band/$bandId/notices"
          params={{ bandId }}
          className="typo-xs-r text-grey-400"
        >
          더보기
        </Link>
      </div>
      {renderBody()}
    </section>
  );
};
