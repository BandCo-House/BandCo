import { useState } from 'react';
import { useBandPlaces } from '@/entities/place/api/useBandPlaces';
import { useBandSongs } from '@/entities/song/api/useBandSongs';
import { PlaceCreateModal } from '@/features/place-create/ui/PlaceCreateModal';
import { Input } from '@/shared/ui/input';
import { SegmentedToggle } from '@/shared/ui/segmented-toggle';
import { Field } from '@/shared/ui/field';
import { cn } from '@/shared/lib/utils';
import type { ScheduleFormState, ScheduleType } from '../model/types';
import { SelectField, type SelectFieldOption } from './components/SelectField';
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

// roundedFull Input의 테두리(field-border)는 유지하고 색·배경·크기만 덮어쓴다.
const inputClass =
  'h-[54px] rounded-full border-white/24 bg-grey-500/24 px-5 typo-base-sb';

const Divider = () => <div aria-hidden className="h-px w-full bg-grey-50/10" />;

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
          variant="roundedFull"
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

      {isPractice && (
        <>
          {/* 합주곡 */}
          <Field label="합주곡" required htmlFor="schedule-song">
            <SelectField
              id="schedule-song"
              ariaLabel="합주곡 선택"
              value={form.songId}
              onValueChange={(songId) => onChange({ songId })}
              options={songOptions}
              placeholder="라이브러리 곡을 선택하세요"
            />
          </Field>

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
    </div>
  );
};
