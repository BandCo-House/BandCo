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

/**
 * 백엔드 SongKey enum(`F_SHARP_MINOR`)을 표기(`F# Minor`)로 바꾼다.
 * SHARP/FLAT은 기호로, 나머지 밑줄은 공백으로 편다.
 */
const formatSongKey = (key: string): string =>
  key
    .replace(/_SHARP/g, '#')
    .replace(/_FLAT/g, 'b')
    .split('_')
    .map((part, index) =>
      index === 0 ? part : part.charAt(0) + part.slice(1).toLowerCase(),
    )
    .join(' ');

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

/**
 * 일정 상세. 합주는 곡 카드 + 세션 편성, 회의는 참여자 목록을 보여준다.
 * 일정 제목은 상단 헤더가 이미 보여주므로 본문에 다시 넣지 않는다.
 */
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

  // 세션이 붙은 참여자만 편성 카드로 올린다(회의 참여자는 skillType이 없다).
  // != null인 이유: 백엔드가 배포되기 전에는 이 필드가 아예 없는(undefined) 응답이 온다.
  // ==/!== null로 가르면 그 응답에서 전원이 편성 쪽으로 몰리고 라벨이 빈칸이 된다.
  const sessionParticipants = detail.participants.filter(
    (participant) => participant.skillType != null,
  );
  const plainParticipants = detail.participants.filter(
    (participant) => participant.skillType == null,
  );

  return (
    <div className="flex flex-col">
      {/* 합주곡 카드 (primary). 곡 키는 오른쪽 끝에 붙는다. */}
      {showSongCard && (
        <div className="flex flex-col gap-1 rounded-xl bg-primary p-4 shadow-[0px_3px_6px_2px_rgba(6,22,59,0.16)]">
          {detail.songs.map((song) => (
            <div
              key={song.songId}
              className="flex items-start justify-between gap-3"
            >
              <div className="flex min-w-0 flex-col">
                <p className="truncate typo-xl-sb text-gradient-top">
                  {song.title}
                </p>
                <p className="truncate typo-sm-sb text-grey-400">
                  {song.artistName}
                </p>
              </div>
              {song.key && (
                <span className="shrink-0 typo-sm-sb text-gradient-top">
                  {formatSongKey(song.key)}
                </span>
              )}
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

      {/* 세션 편성(합주 전용). 세션명이 위, 그 사람이 가진 스킬은 카드 안이다. */}
      {sessionParticipants.length > 0 && (
        <section className="flex flex-col gap-5 pt-5 pb-8">
          <h2 className="typo-xl-sb text-grey-50">세션 편성</h2>
          <div className="grid grid-cols-2 gap-4">
            {sessionParticipants.map((participant) => (
              <div
                key={participant.participantId}
                className="flex flex-col gap-2"
              >
                <span className="typo-sm-b text-grey-50">
                  {participant.skillType?.name}
                </span>
                <MemberCard
                  name={participant.nickname}
                  note={participant.note}
                  sessions={
                    skillsByMemberId.get(participant.bandMemberId) ?? []
                  }
                  tone="glass"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 참여자(회의, 또는 세션이 배정되지 않은 인원) */}
      {(plainParticipants.length > 0 || detail.participants.length === 0) && (
        <section className="flex flex-col gap-5 pt-5 pb-8">
          <h2 className="typo-xl-sb text-grey-50">참여자</h2>
          {detail.participants.length === 0 ? (
            <p className="typo-sm-r text-grey-300">참여자가 없어요.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {plainParticipants.map((participant) => (
                <MemberCard
                  key={participant.participantId}
                  name={participant.nickname}
                  note={participant.note}
                  sessions={
                    skillsByMemberId.get(participant.bandMemberId) ?? []
                  }
                  tone="glass"
                />
              ))}
            </div>
          )}
        </section>
      )}

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
