import { useState } from 'react';
import { useBandPlaces } from '@/entities/place/api/useBandPlaces';
import { useBandSongs } from '@/entities/song/api/useBandSongs';
import { LinkAttachmentItem } from '@/entities/link/ui/LinkAttachmentItem';
import { PlaceCreateModal } from '@/features/place-create/ui/PlaceCreateModal';
import { SongCreateModal } from '@/features/song-create';
import { AttachmentItem } from '@/shared/ui/attachment-item';
import { Input } from '@/shared/ui/input';
import { SegmentedToggle } from '@/shared/ui/segmented-toggle';
import { Field, fieldSurfaceClass } from '@/shared/ui/field';
import { SelectField, type SelectFieldOption } from '@/shared/ui/select-field';
import { cn } from '@/shared/lib/utils';
import type { ScheduleFormState, ScheduleType } from '../model/types';
import { ScheduleTimeSheet } from './components/ScheduleTimeSheet';
import { ParticipantSection } from './components/ParticipantSection';

interface ScheduleFormViewProps {
  form: ScheduleFormState;
  onChange: (patch: Partial<ScheduleFormState>) => void;
  bandId: string;
}

const TYPE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'PRACTICE', label: '합주' },
  { value: 'MEETING', label: '회의' },
];

const inputClass = 'typo-base-sb text-grey-50';

const Divider = () => <div aria-hidden className="h-px w-full bg-grey-50/10" />;

/**
 * 스킴이 없으면 https를 붙이고 canonical 문자열로 정규화한다. 형식이 아니면 null.
 * 원본을 그대로 돌려주면 `example.com`과 `https://example.com/`이 서로 다른
 * 첨부로 쌓여 중복 판정이 뚫린다.
 */
const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    return parsed.hostname ? parsed.toString() : null;
  } catch {
    return null;
  }
};

/** 같은 파일을 두 번 고르면 구분되도록 이름 외 메타까지 키에 넣는다. */
const fileKey = (file: File): string =>
  `${file.name}-${file.size}-${file.lastModified}`;

/** 밑줄 링크형 텍스트 버튼(장소 추가하기). */
const LinkButton = ({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="typo-sm-sb text-grey-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
  >
    {children}
  </button>
);

/**
 * 합주/회의 공용 일정 입력 폼. 유형 토글로 합주 전용(곡) 필드를 켜고,
 * 참여자 선택은 합주·회의 공통 ParticipantSection으로 통일한다.
 */
export const ScheduleFormView = ({
  form,
  onChange,
  bandId,
}: ScheduleFormViewProps) => {
  const isPractice = form.scheduleType === 'PRACTICE';
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);

  // 첨부 서버 계약(업로드·일정 첨부 필드)이 아직 없어 화면 상태로만 보관한다.
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState('');

  const addFiles = (selected: FileList | null) => {
    if (!selected?.length) return;
    const added = Array.from(selected);
    setReferenceFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      return [...prev, ...added.filter((file) => !seen.has(fileKey(file)))];
    });
  };

  const addLink = () => {
    const url = normalizeUrl(linkDraft);
    if (!url) return;
    setLinks((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setLinkDraft('');
  };

  const { data: places = [] } = useBandPlaces(bandId);
  const { data: songs = [] } = useBandSongs(
    bandId,
    {},
    { enabled: isPractice },
  );

  const placeOptions: SelectFieldOption[] = places.map((place) => ({
    value: place.placeId,
    label: place.name,
  }));
  const songOptions: SelectFieldOption[] = songs.map((song) => ({
    value: song.id,
    label: `${song.title} · ${song.artistName}`,
  }));

  const referenceField = (
    <Field label="참고 자료">
      <label
        className={cn(
          fieldSurfaceClass,
          'flex w-full cursor-pointer items-center typo-base-sb text-grey-300',
          'focus-within:outline-2 focus-within:outline-primary',
        )}
      >
        파일을 첨부하세요
        <input
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            // 같은 파일을 지웠다가 다시 고를 수 있게 입력값을 비운다.
            event.target.value = '';
          }}
        />
      </label>
      {referenceFiles.map((file) => (
        <AttachmentItem
          key={fileKey(file)}
          name={file.name}
          onRemove={() =>
            setReferenceFiles((prev) =>
              prev.filter((item) => fileKey(item) !== fileKey(file)),
            )
          }
        />
      ))}
    </Field>
  );

  const linkField = (
    <Field label="외부 링크" htmlFor="schedule-link">
      <Input
        id="schedule-link"
        type="url"
        inputMode="url"
        variant="underline"
        className={inputClass}
        value={linkDraft}
        onChange={(event) => setLinkDraft(event.target.value)}
        onBlur={addLink}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          addLink();
        }}
        placeholder="링크를 붙여넣고 Enter"
      />
      {links.map((url) => (
        <LinkAttachmentItem
          key={url}
          url={url}
          onRemove={() => setLinks((prev) => prev.filter((l) => l !== url))}
        />
      ))}
    </Field>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* 일정 유형 */}
      <Field label="일정 유형" labelSize="lg" required>
        <SegmentedToggle
          variant="tab"
          label="일정 유형"
          options={TYPE_OPTIONS}
          value={form.scheduleType}
          onChange={(scheduleType) => onChange({ scheduleType })}
        />
      </Field>

      {/* 이름 */}
      <Field
        label={isPractice ? '합주 이름' : '회의 이름'}
        required
        htmlFor="schedule-title"
      >
        <Input
          id="schedule-title"
          variant="underline"
          className={inputClass}
          value={form.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={
            isPractice ? '합주 이름을 입력하세요' : '회의 이름을 입력하세요'
          }
          maxLength={40}
        />
      </Field>

      {/* 시작 / 종료 시간 */}
      <Field label="시작 / 종료 시간" required>
        <ScheduleTimeSheet
          date={form.date}
          startTime={form.startTime}
          onStartTimeChange={(startTime) => onChange({ startTime })}
          endTime={form.endTime}
          onEndTimeChange={(endTime) => onChange({ endTime })}
        />
      </Field>

      {/* 장소 */}
      <Field label="장소" required htmlFor="schedule-place">
        <SelectField
          id="schedule-place"
          ariaLabel="장소 선택"
          value={form.placeId}
          onValueChange={(placeId) => onChange({ placeId })}
          options={placeOptions}
          placeholder={
            isPractice ? '연습 장소를 선택하세요' : '회의 장소를 선택하세요'
          }
        />
        <div className="flex justify-end">
          <LinkButton onClick={() => setIsPlaceModalOpen(true)}>
            장소 추가하기
          </LinkButton>
        </div>
      </Field>

      <Divider />

      {isPractice ? (
        <>
          <Field label="합주곡" required htmlFor="schedule-song">
            <SelectField
              id="schedule-song"
              ariaLabel="합주곡 선택"
              value={form.songId}
              onValueChange={(songId) => onChange({ songId })}
              options={songOptions}
              placeholder="라이브러리 곡을 선택하세요"
            />
            <div className="flex justify-end">
              <LinkButton onClick={() => setIsSongModalOpen(true)}>
                합주곡 추가하기
              </LinkButton>
            </div>
          </Field>

          {referenceField}
          {linkField}

          <Divider />
        </>
      ) : (
        <>
          {linkField}

          <Divider />
        </>
      )}

      {/* 참여자 (합주·회의 공통) */}
      <ParticipantSection
        bandId={bandId}
        value={form.participantBandMemberIds}
        onChange={(participantBandMemberIds) =>
          onChange({ participantBandMemberIds })
        }
      />

      <Divider />

      {/* 메모 (선택) */}
      <Field label="메모" htmlFor="schedule-memo">
        <textarea
          id="schedule-memo"
          value={form.memo}
          onChange={(event) => onChange({ memo: event.target.value })}
          placeholder="추가 메모사항을 입력하세요"
          maxLength={500}
          className={cn(
            'min-h-[100px] w-full resize-none rounded-md field-border border-white/24 bg-grey-500/24 px-5 py-4 typo-base-sb text-grey-50',
            'outline-none placeholder:text-grey-300 focus-visible:border-primary',
          )}
        />
      </Field>

      <PlaceCreateModal
        open={isPlaceModalOpen}
        onOpenChange={setIsPlaceModalOpen}
        bandId={bandId}
        onCreated={(placeId) => onChange({ placeId })}
      />

      <SongCreateModal
        open={isSongModalOpen}
        onOpenChange={setIsSongModalOpen}
        bandId={bandId}
        onCreated={(songId) => onChange({ songId })}
      />
    </div>
  );
};
