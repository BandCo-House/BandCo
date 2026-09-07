import { Calendar, Clock, MapPin } from 'lucide-react';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import { LinkAttachmentItem } from '@/entities/link/ui/LinkAttachmentItem';
import type { ScheduleDetail } from '@/entities/schedule/model/types';
import { AttachmentItem } from '@/shared/ui/attachment-item';
import { formatClockTime, formatDotDate } from '@/shared/lib/date';
import { MemberCard } from './components/MemberCard';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';

interface ScheduleDetailViewProps {
  detail: ScheduleDetail;
  bandId: string;
}

const InfoItem = ({
  icon: Icon,
  children,
}: {
  icon: typeof Calendar;
  children: string;
}) => (
  <div className="flex flex-1 items-center justify-center gap-1">
    <Icon aria-hidden="true" className="size-4 shrink-0 text-grey-200" />
    <span className="truncate typo-xs-sb text-grey-200">{children}</span>
  </div>
);

/** 일정 상세. 합주곡 카드(합주 전용) · 날짜/시간/장소 · 참여자 카드. */
export const ScheduleDetailView = ({
  detail,
  bandId,
}: ScheduleDetailViewProps) => {
  const { data: members = [] } = useBandMembers(bandId, {
    take: MEMBER_PICKER_TAKE,
  });
  const skillsByMemberId = new Map(
    members.map((m) => [m.bandMemberId, m.skills.map((s) => s.skillName)]),
  );

  const timeRange = detail.startAt
    ? `${formatClockTime(detail.startAt)}-${formatClockTime(detail.endAt)}`
    : '-';

  const hasReferenceFiles = detail.referenceFiles.length > 0;
  const hasExternalLinks = detail.externalLinks.length > 0;

  // 곡은 합주 전용이라 회의에는 이 카드를 띄우지 않는다. 실을 곡이 없으면 접는다.
  const isPractice = detail.scheduleType === 'PRACTICE';
  const showSongCard = isPractice && detail.songs.length > 0;

  return (
    <div className="flex flex-col">
      {/* 합주곡 + 메모 카드 (primary). 일정 제목은 상단 헤더가 이미 보여준다. */}
      {showSongCard && (
        <div className="flex flex-col gap-1 rounded-xl bg-primary p-4 shadow-[0px_3px_6px_2px_rgba(6,22,59,0.16)]">
          {detail.songs.map((song) => (
            <div key={song.songId} className="flex flex-col">
              <p className="typo-xl-sb text-gradient-top">{song.title}</p>
              <p className="typo-sm-sb text-grey-400">{song.artistName}</p>
            </div>
          ))}
        </div>
      )}

      {/* 메모는 합주·회의 공통이다. 곡 카드 안에 두면 회의 안건이 어디에도 안 보인다. */}
      {detail.memo ? (
        <p className="pt-3 typo-base-r text-grey-100">{detail.memo}</p>
      ) : null}

      {/* 날짜 / 시간 / 장소 */}
      <div className="flex items-center justify-center gap-3 py-8">
        <InfoItem icon={Calendar}>{formatDotDate(detail.startAt)}</InfoItem>
        <InfoItem icon={Clock}>{timeRange}</InfoItem>
        <InfoItem icon={MapPin}>{detail.place?.name ?? '장소 없음'}</InfoItem>
      </div>

      <div aria-hidden className="h-px w-full bg-grey-50/10" />

      {/* 참여자 */}
      <section className="flex flex-col gap-5 pt-5 pb-8">
        <h2 className="typo-xl-sb text-grey-50">참여자</h2>
        {detail.participants.length === 0 ? (
          <p className="typo-sm-r text-grey-300">참여자가 없어요.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {detail.participants.map((participant) => (
              <MemberCard
                key={participant.participantId}
                name={participant.nickname}
                note={participant.note}
                sessions={skillsByMemberId.get(participant.bandMemberId) ?? []}
                tone="glass"
              />
            ))}
          </div>
        )}
      </section>

      {/* 첨부(참고 자료·외부 링크). 있을 때만 노출한다. */}
      {(hasReferenceFiles || hasExternalLinks) && (
        <>
          <div aria-hidden className="h-px w-full bg-grey-50/10" />
          <section className="flex flex-col gap-5 pt-5 pb-8">
            {hasReferenceFiles && (
              <div className="flex flex-col gap-2">
                <h2 className="typo-xl-sb text-grey-50">참고 자료</h2>
                {detail.referenceFiles.map((file) => (
                  <AttachmentItem
                    key={file.id}
                    name={file.fileName}
                    href={file.fileUrl}
                  />
                ))}
              </div>
            )}
            {hasExternalLinks && (
              <div className="flex flex-col gap-2">
                <h2 className="typo-xl-sb text-grey-50">외부 링크</h2>
                {detail.externalLinks.map((url) => (
                  <LinkAttachmentItem key={url} url={url} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
