import { Link } from '@tanstack/react-router';
import { useBandNotices } from '@/entities/notice/api/useBandNotices';

// 공지는 보조 정보: 실패해도 이 블록만 대체 문구로 표시하고, 최신 N개만 노출한다.
const NOTICE_LIMIT = 2;

const formatNoticeDate = (iso: string): string => {
  const date = new Date(iso);
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
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
      return <p className="typo-sm-r text-grey-400">불러오는 중...</p>;
    }
    if (isError) {
      return (
        <p className="typo-sm-r text-grey-400">공지를 불러오지 못했어요.</p>
      );
    }
    if (!notices || notices.length === 0) {
      return <p className="typo-sm-r text-grey-400">공지사항이 없습니다.</p>;
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
              <span className="shrink-0 typo-sm-r text-grey-400">
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
