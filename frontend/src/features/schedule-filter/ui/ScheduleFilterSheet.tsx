import { useState, type ReactNode } from 'react';
import { RotateCcw, XIcon } from 'lucide-react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useBandSongs } from '@/entities/song/api/useBandSongs';
import { useBandPlaces } from '@/entities/place/api/useBandPlaces';
import { useBandTeams } from '@/entities/team/api/useBandTeams';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { type ScheduleDetailFilter } from '../model/types';

interface ScheduleFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 곡·장소·팀 목록은 밴드 단위 API에서 온다. */
  bandId: string;
  value: ScheduleDetailFilter;
  onApply: (value: ScheduleDetailFilter) => void;
}

interface FilterChipProps {
  selected?: boolean;
  removable?: boolean;
  label: string;
  onClick: () => void;
}

const FilterChip = ({
  selected,
  removable,
  label,
  onClick,
}: FilterChipProps) => (
  <button
    type="button"
    aria-pressed={removable ? undefined : selected}
    aria-label={removable ? `${label} 제거` : undefined}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1 rounded-full py-2 typo-xs-sb transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-key',
      removable ? 'pr-3 pl-4' : 'px-4',
      selected
        ? 'bg-primary text-gradient-top'
        : 'border border-grey-400 bg-grey-500/24 text-grey-100',
    )}
  >
    {label}
    {removable && <XIcon aria-hidden="true" className="size-4" />}
  </button>
);

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-2">
    <h2 className="typo-base-sb text-grey-50">{title}</h2>
    <div className="flex flex-wrap gap-2">{children}</div>
  </section>
);

/**
 * 상세 필터(전체 화면): 연주곡·연습 장소·연습 팀을 다중 선택한다.
 * 응답의 songs/place/team으로 타임라인을 클라이언트에서 거른다(다중 선택이라 서버 단일값 파라미터 대신).
 */
export const ScheduleFilterSheet = ({
  open,
  onOpenChange,
  bandId,
  value,
  onApply,
}: ScheduleFilterSheetProps) => {
  const { data: songs = [] } = useBandSongs(bandId);
  const { data: places = [] } = useBandPlaces(bandId);
  const { data: teams = [] } = useBandTeams(bandId);

  // 열리는 순간 상위 확정값으로 draft를 초기화한다(effect 대신 렌더 중 파생).
  const [songIds, setSongIds] = useState<string[]>(value.songIds);
  const [placeIds, setPlaceIds] = useState<string[]>(value.placeIds);
  const [teamIds, setTeamIds] = useState<string[]>(value.teamIds);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSongIds(value.songIds);
      setPlaceIds(value.placeIds);
      setTeamIds(value.teamIds);
    }
  }

  const toggle = (
    ids: string[],
    setIds: (next: string[]) => void,
    id: string,
  ) => setIds(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const selectedSongs = songs.filter((song) => songIds.includes(song.id));
  const selectedPlaces = places.filter((place) =>
    placeIds.includes(place.placeId),
  );
  const selectedTeams = teams.filter((team) => teamIds.includes(team.teamId));
  const hasSelection = songIds.length + placeIds.length + teamIds.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          연주곡과 연습 장소로 일정을 필터링합니다.
        </SheetDescription>

        <header className="flex items-center gap-3 py-3 pr-5 pl-2.5">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
          <SheetTitle className="typo-lg-sb text-grey-50">필터</SheetTitle>
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 pt-4 pb-6">
          {hasSelection && (
            <div className="flex flex-wrap gap-2">
              {selectedSongs.map((song) => (
                <FilterChip
                  key={`selected-song-${song.id}`}
                  selected
                  removable
                  label={song.title}
                  onClick={() => toggle(songIds, setSongIds, song.id)}
                />
              ))}
              {selectedPlaces.map((place) => (
                <FilterChip
                  key={`selected-place-${place.placeId}`}
                  selected
                  removable
                  label={place.name}
                  onClick={() => toggle(placeIds, setPlaceIds, place.placeId)}
                />
              ))}
              {selectedTeams.map((team) => (
                <FilterChip
                  key={`selected-team-${team.teamId}`}
                  selected
                  removable
                  label={team.name}
                  onClick={() => toggle(teamIds, setTeamIds, team.teamId)}
                />
              ))}
            </div>
          )}

          <FilterSection title="연주곡">
            {songs.map((song) => (
              <FilterChip
                key={song.id}
                selected={songIds.includes(song.id)}
                label={song.title}
                onClick={() => toggle(songIds, setSongIds, song.id)}
              />
            ))}
          </FilterSection>

          <FilterSection title="연습 장소">
            {places.map((place) => (
              <FilterChip
                key={place.placeId}
                selected={placeIds.includes(place.placeId)}
                label={place.name}
                onClick={() => toggle(placeIds, setPlaceIds, place.placeId)}
              />
            ))}
          </FilterSection>

          {/* 팀 목록은 GET /bands/:bandId/teams로 채우고, 일정 응답의 team으로 타임라인을 거른다. */}
          <FilterSection title="연습 팀">
            {teams.map((team) => (
              <FilterChip
                key={team.teamId}
                selected={teamIds.includes(team.teamId)}
                label={team.name}
                onClick={() => toggle(teamIds, setTeamIds, team.teamId)}
              />
            ))}
          </FilterSection>
        </div>

        <div className="flex items-center gap-3 px-5 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            size="lg"
            width="flex"
            className="border-grey-50 text-grey-50"
            onClick={() => {
              setSongIds([]);
              setPlaceIds([]);
              setTeamIds([]);
            }}
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            초기화
          </Button>
          <Button
            type="button"
            variant="shining"
            size="lg"
            width="flex"
            onClick={() => {
              onApply({ songIds, placeIds, teamIds });
              onOpenChange(false);
            }}
          >
            완료
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
