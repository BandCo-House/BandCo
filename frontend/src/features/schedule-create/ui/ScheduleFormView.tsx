import { useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { useBandPlaces } from '@/entities/place/api/useBandPlaces';
import { useBandSongs } from '@/entities/song/api/useBandSongs';
import { useSkillTypes } from '@/entities/skill/api/useSkillTypes';
import { useBandMembers } from '@/entities/member/api/useBandMembers';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { PlaceCreateModal } from '@/features/place-create/ui/PlaceCreateModal';
import { Input } from '@/shared/ui/input';
import { SegmentedToggle } from '@/shared/ui/segmented-toggle';
import { Field } from '@/shared/ui/field';
import { cn } from '@/shared/lib/utils';
import type { ScheduleFormState, ScheduleType } from '../model/types';
import { SelectField, type SelectFieldOption } from './components/SelectField';
import { ScheduleTimeSheet } from './components/ScheduleTimeSheet';
import { MemberCard } from './components/MemberCard';

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

/** 밑줄 링크형 텍스트 버튼(장소 추가하기 · 리더/부리더/전원선택). */
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

const primarySession = (member: BandMemberListItem): string | undefined =>
  (member.skills.find((s) => s.isPrimary) ?? member.skills[0])?.skillName;

const sessionNames = (member: BandMemberListItem): string[] =>
  member.skills.map((s) => s.skillName);

/**
 * 합주/회의 공용 일정 입력 폼. 유형 토글로 합주(곡·세션·멤버) / 회의(참여자) 필드를 전환한다.
 * 라벨↔입력 구조는 공용 Field로 통일하고, 장소·곡·세션·멤버는 실제 엔티티 훅에 연결된다.
 */
export const ScheduleFormView = ({
  form,
  onChange,
  bandId,
}: ScheduleFormViewProps) => {
  const isPractice = form.scheduleType === 'PRACTICE';
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  // 악보/코드는 아직 백엔드 저장 필드가 없어 파일명만 로컬로 보여준다(전송하지 않음).
  const [scoreFileName, setScoreFileName] = useState<string | null>(null);

  const { data: places = [] } = useBandPlaces(bandId);
  const { data: songs = [] } = useBandSongs(
    bandId,
    {},
    { enabled: isPractice },
  );
  const { data: skillTypes = [] } = useSkillTypes(isPractice);
  const { data: members = [] } = useBandMembers(bandId);

  const placeOptions: SelectFieldOption[] = places.map((place) => ({
    value: place.placeId,
    label: place.name,
  }));
  const songOptions: SelectFieldOption[] = songs.map((song) => ({
    value: song.id,
    label: `${song.title} · ${song.artistName}`,
  }));
  const sessionOptions: SelectFieldOption[] = [
    { value: 'all', label: '전체' },
    ...skillTypes.map((skill) => ({ value: skill.id, label: skill.name })),
  ];

  const selectedIds = new Set(form.participantBandMemberIds);
  const sessionFiltered =
    isPractice && form.sessionSkillId && form.sessionSkillId !== 'all'
      ? members.filter((m) =>
          m.skills.some((s) => s.skillTypeId === form.sessionSkillId),
        )
      : members;
  const memberOptions: SelectFieldOption[] = sessionFiltered
    .filter((m) => !selectedIds.has(m.bandMemberId))
    .map((m) => ({ value: m.bandMemberId, label: m.nickname }));

  const selectedMembers = form.participantBandMemberIds
    .map((id) => members.find((m) => m.bandMemberId === id))
    .filter((m): m is BandMemberListItem => Boolean(m));

  const addMember = (id: string) =>
    onChange({
      participantBandMemberIds: [...form.participantBandMemberIds, id],
    });
  const removeMember = (id: string) =>
    onChange({
      participantBandMemberIds: form.participantBandMemberIds.filter(
        (mId) => mId !== id,
      ),
    });
  const selectByRole = (roles: string[]) =>
    onChange({
      participantBandMemberIds: members
        .filter((m) => roles.includes(m.role))
        .map((m) => m.bandMemberId),
    });
  const selectAll = () =>
    onChange({
      participantBandMemberIds: members.map((m) => m.bandMemberId),
    });

  const handleScoreSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setScoreFileName(file.name);
  };

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
          aria-required
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

          {/* 악보 / 코드 (선택) */}
          <Field label="악보 / 코드">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full field-border border-grey-300 bg-surface-1 px-5 py-4 text-grey-50">
              <Upload aria-hidden="true" className="size-5" />
              <span className="typo-sm-m">
                {scoreFileName ?? '악보/코드 업로드'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleScoreSelect}
                className="sr-only"
              />
            </label>
          </Field>

          <Divider />

          {/* 세션 / 멤버 선택 */}
          <section className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Field
                className="flex-1"
                label="세션 선택"
                htmlFor="schedule-session"
              >
                <SelectField
                  id="schedule-session"
                  ariaLabel="세션 선택"
                  value={form.sessionSkillId ?? 'all'}
                  onValueChange={(sessionSkillId) =>
                    onChange({ sessionSkillId })
                  }
                  options={sessionOptions}
                  placeholder="전체"
                />
              </Field>
              <Field
                className="flex-1"
                label="멤버 선택"
                htmlFor="schedule-member"
              >
                <SelectField
                  id="schedule-member"
                  ariaLabel="멤버 추가"
                  value={null}
                  onValueChange={addMember}
                  options={memberOptions}
                  placeholder="멤버 추가"
                />
              </Field>
            </div>
            <SelectedMembers
              members={selectedMembers}
              tone="solid"
              withSessionLabel
              onRemove={removeMember}
            />
          </section>
        </>
      ) : (
        <section className="flex flex-col gap-3">
          {/* 참여자 */}
          <Field label="참여자" required htmlFor="schedule-participant">
            <SelectField
              id="schedule-participant"
              ariaLabel="참여자 추가"
              value={null}
              onValueChange={addMember}
              options={memberOptions}
              placeholder="참여자를 선택하세요"
            />
            <div className="flex justify-end gap-4">
              <LinkButton onClick={() => selectByRole(['BM'])}>리더</LinkButton>
              <LinkButton onClick={() => selectByRole(['ADMIN'])}>
                부리더
              </LinkButton>
              <LinkButton onClick={selectAll}>전원선택</LinkButton>
            </div>
          </Field>
          <SelectedMembers
            members={selectedMembers}
            tone="glass"
            onRemove={removeMember}
          />
        </section>
      )}

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
      />
    </div>
  );
};

/** 선택된 멤버 카드 그리드. 합주는 세션 라벨을 카드 위에 붙인다. */
const SelectedMembers = ({
  members,
  tone,
  withSessionLabel,
  onRemove,
}: {
  members: BandMemberListItem[];
  tone: 'glass' | 'solid';
  withSessionLabel?: boolean;
  onRemove: (id: string) => void;
}) => {
  if (members.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4">
      {members.map((member) => (
        <div key={member.bandMemberId} className="flex flex-col gap-2">
          {withSessionLabel && (
            <p className="typo-sm-b text-grey-50">
              {primarySession(member) ?? '세션'}
            </p>
          )}
          <MemberCard
            name={member.nickname}
            sessions={sessionNames(member)}
            tone={tone}
            selected
            onClick={() => onRemove(member.bandMemberId)}
          />
        </div>
      ))}
    </div>
  );
};
