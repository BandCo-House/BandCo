import { useParams } from '@tanstack/react-router';
import {
  horizontalFadeMask,
  useHorizontalScrollEdges,
} from '@/shared/lib/scroll-fade';
import { useBandSongs } from '@/entities/song/api/useBandSongs';
import { SongLibraryItem } from '@/entities/song/ui/SongLibraryItem';
import { useBandPlaces } from '@/entities/place/api/useBandPlaces';
import { PlaceCard } from '@/entities/place/ui/PlaceCard';
import { LibrarySectionHeader } from './LibrarySectionHeader';

const STATE_MESSAGE_CLASS = 'py-6 text-center typo-sm-r text-grey-300';

interface SectionStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  errorText: string;
}

/**
 * 합주곡/연습 장소는 보조 정보라, 실패해도 블록 단위 안내만 보여주고
 * 페이지(밴드 라이브러리)는 정상 렌더한다.
 */
const SectionState = ({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  errorText,
}: SectionStateProps) => {
  if (isLoading) return <p className={STATE_MESSAGE_CLASS}>불러오는 중...</p>;
  if (isError) return <p className={STATE_MESSAGE_CLASS}>{errorText}</p>;
  if (isEmpty) return <p className={STATE_MESSAGE_CLASS}>{emptyText}</p>;
  return null;
};

export const BandLibrary = () => {
  const { bandId } = useParams({ from: '/band/$bandId' });
  const songsQuery = useBandSongs(bandId);
  const placesQuery = useBandPlaces(bandId);

  const songs = songsQuery.data ?? [];
  const places = placesQuery.data ?? [];

  // 합주곡 가로 스크롤: 스크롤바를 숨기고 스크롤 가능한 끝만 mask로 페이드한다.
  const {
    ref: songScrollRef,
    atStart: songAtStart,
    atEnd: songAtEnd,
  } = useHorizontalScrollEdges<HTMLUListElement>();

  // TODO: 추가(+) 버튼은 합주곡/연습 장소 생성 모달과 연결한다.
  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-2 p-5">
        <h1 className="typo-xl-sb text-grey-50">라이브러리</h1>
        <p className="typo-base-r text-grey-300">
          밴드에서 연습할 합주곡과 연습 장소를
          <br />
          추가하고 관리해보세요
        </p>
      </header>

      <section className="flex flex-col gap-5 px-5">
        <LibrarySectionHeader title="합주곡" addLabel="합주곡 추가" />
        {songs.length > 0 ? (
          <ul
            ref={songScrollRef}
            style={horizontalFadeMask(!songAtStart, !songAtEnd)}
            className="scrollbar-none flex gap-5 overflow-x-auto"
          >
            {songs.map((song) => (
              <li key={song.id}>
                <SongLibraryItem song={song} />
              </li>
            ))}
          </ul>
        ) : (
          <SectionState
            isLoading={songsQuery.isLoading}
            isError={songsQuery.isError}
            isEmpty
            emptyText="등록된 합주곡이 없어요."
            errorText="합주곡을 불러오지 못했어요."
          />
        )}
      </section>

      <section className="flex flex-col gap-5 px-5">
        <LibrarySectionHeader title="연습 장소" addLabel="연습 장소 추가" />
        {places.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2">
            {places.map((place) => (
              <li key={place.placeId}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
        ) : (
          <SectionState
            isLoading={placesQuery.isLoading}
            isError={placesQuery.isError}
            isEmpty
            emptyText="등록된 연습 장소가 없어요."
            errorText="연습 장소를 불러오지 못했어요."
          />
        )}
      </section>
    </div>
  );
};
