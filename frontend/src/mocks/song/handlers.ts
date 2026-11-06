import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type {
  CreateSongRequest,
  SongKey,
  SongListItem,
  SongPreview,
  UpdateSongRequest,
} from '@/entities/song/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 합주곡 목록 mock (GET /bands/:bandId/songs)
const SONG_FIXTURES: {
  title: string;
  artistName: string;
  key?: SongKey | null;
  bpm?: number;
  songLength?: number;
  hasCover?: boolean;
  externalLinks?: string[];
  referenceFiles?: { id: string; fileUrl: string; fileName: string; createdAt: string }[];
}[] = [
  {
    title: '좋은 날',
    artistName: '아이유',
    key: 'C',
    bpm: 128,
    songLength: 233,
    externalLinks: ['https://www.youtube.com/watch?v=jeqdYqsrsA0'],
    referenceFiles: [
      {
        id: 'ref-1',
        fileUrl: 'https://example.com/files/good_day_score.pdf',
        fileName: 'good_day_score.pdf',
        createdAt: '2026-05-01T00:00:00+09:00',
      },
    ],
  },
  {
    title: '봄날',
    artistName: '방탄소년단',
    key: 'FS',
    bpm: 108,
    songLength: 274,
    externalLinks: ['https://www.youtube.com/watch?v=xEeFrLSkMm8'],
  },
  {
    title: 'Dynamite',
    artistName: '방탄소년단',
    key: 'CSM',
    bpm: 114,
    songLength: 199,
  },
  {
    title: '밤편지',
    artistName: '아이유',
    key: 'EM',
    bpm: 72,
    songLength: 253,
  },
  {
    title: '건널목',
    artistName: 'Whiteusedsocks',
    key: 'D',
    bpm: 120,
    songLength: 202,
    externalLinks: ['https://www.youtube.com/watch?v=bx1Bh8ZvH84'],
    referenceFiles: [
      {
        id: 'ref-5-1',
        fileUrl: 'https://example.com/files/image_70.png',
        fileName: 'image_70.png',
        createdAt: '2026-05-01T00:00:00+09:00',
      },
    ],
  },
  // 커버 이미지가 없는 곡. 라이브러리에서 빈 커버 표시를 확인한다.
  {
    title: 'Attention',
    artistName: '뉴진스',
    hasCover: false,
    key: 'AM',
    bpm: 105,
    songLength: 180,
  },
];

const bandSongs: SongListItem[] = SONG_FIXTURES.map((fixture, i) => ({
  id: `band-song-${i + 1}`,
  bandId: 'band-1',
  title: fixture.title,
  artistName: fixture.artistName,
  key: fixture.key ?? null,
  bpm: fixture.bpm ?? 128,
  difficultyLevel: 2,
  sourceUrl: `https://www.deezer.com/track/${i + 1}`,
  sourceType: 'DEEZER',
  externalTrackId: `track-${i + 1}`,
  songCoverUrl:
    fixture.hasCover === false
      ? null
      : `https://picsum.photos/seed/band-song-${i + 1}/200`,
  songLength: fixture.songLength ?? 202,
  externalLinks: fixture.externalLinks ?? [],
  referenceFiles: fixture.referenceFiles ?? [],
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
}));

// 외부 음원 검색 mock.
const buildTrackResults = (query: string): SongPreview[] =>
  Array.from({ length: 3 }, (_, i) => ({
    externalTrackId: `track-${i + 1}`,
    title: `${query} 관련 곡 ${i + 1}`,
    artistName: 'DAY6(데이식스)',
    albumName: 'The Book of Us',
    albumImageUrl: `https://picsum.photos/seed/track-${i + 1}/300`,
    releaseDate: '2021-04-19',
    durationMs: 202_000,
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    sourceUrl: `https://www.deezer.com/track/${i + 1}`,
    sourceType: 'DEEZER' as const,
  }));

export const songHandlers = [
  http.get(`${API_URL}/bands/:bandId/songs`, () => {
    return HttpResponse.json<
      ApiSuccessResponse<{ items: SongListItem[]; meta: unknown }>
    >({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        items: bandSongs,
        meta: { count: bandSongs.length, take: 20, cursor: null, next: null },
      },
    });
  }),

  http.get(`${API_URL}/songs/tracks/search`, ({ request }) => {
    const query = new URL(request.url).searchParams.get('query') ?? '';

    return HttpResponse.json<ApiSuccessResponse<SongPreview[]>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: query.includes('없는곡') ? [] : buildTrackResults(query),
    });
  }),

  // 외부 트랙 단건 조회 (미리듣기 음원 제공)
  http.get(`${API_URL}/songs/tracks/:trackId`, ({ params }) => {
    const trackId = String(params.trackId);

    return HttpResponse.json<ApiSuccessResponse<SongPreview>>({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        externalTrackId: trackId,
        title: '미리듣기 트랙',
        artistName: 'DAY6(데이식스)',
        albumName: 'The Book of Us',
        albumImageUrl: `https://picsum.photos/seed/${trackId}/300`,
        releaseDate: '2021-04-19',
        durationMs: 202_000,
        previewUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        sourceUrl: `https://www.deezer.com/track/${trackId}`,
        sourceType: 'DEEZER',
      },
    });
  }),

  // 곡 생성 (POST /bands/:bandId/songs)
  http.post(`${API_URL}/bands/:bandId/songs`, async ({ request, params }) => {
    const body = (await request.json()) as CreateSongRequest;
    const created: SongListItem = {
      id: `band-song-${bandSongs.length + 1}`,
      bandId: String(params.bandId),
      title: body.title,
      artistName: body.artistName,
      key: body.key ?? null,
      bpm: body.bpm ?? null,
      difficultyLevel: null,
      sourceUrl: body.sourceUrl ?? null,
      sourceType: body.sourceType ?? null,
      externalTrackId: body.externalTrackId ?? null,
      songCoverUrl: body.songCoverUrl ?? null,
      songLength: body.songLength ?? null,
      externalLinks: body.externalLinks ?? [],
      referenceFiles: (body.referenceFiles ?? []).map((file, index) => ({
        id: `ref-${bandSongs.length + 1}-${index + 1}`,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        createdAt: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
      skills: [],
    };
    bandSongs.push(created);

    return HttpResponse.json<ApiSuccessResponse<{ song: SongListItem }>>(
      {
        status: 'success',
        error: null,
        message: '요청 성공',
        data: { song: created },
      },
      { status: 201 },
    );
  }),

  // 곡 수정 (PATCH /songs/:songId)
  http.patch(`${API_URL}/songs/:songId`, async ({ request, params }) => {
    const { songId } = params as { songId: string };
    const body = (await request.json()) as UpdateSongRequest;
    const target = bandSongs.find((s) => s.id === songId);

    if (target) {
      if (body.title !== undefined) target.title = body.title;
      if (body.artistName !== undefined) target.artistName = body.artistName;
      if (body.key !== undefined) target.key = body.key;
      if (body.bpm !== undefined) target.bpm = body.bpm;
      if (body.songLength !== undefined) target.songLength = body.songLength;
      if (body.songCoverUrl !== undefined) target.songCoverUrl = body.songCoverUrl;
      if (body.sourceUrl !== undefined) target.sourceUrl = body.sourceUrl;
      if (body.sourceType !== undefined) target.sourceType = body.sourceType;
      if (body.externalLinks !== undefined) target.externalLinks = body.externalLinks;
      if (body.referenceFiles !== undefined) {
        target.referenceFiles = body.referenceFiles.map((file, idx) => ({
          id: `ref-${songId}-${idx + 1}`,
          fileUrl: file.fileUrl,
          fileName: file.fileName,
          createdAt: new Date().toISOString(),
        }));
      }
    }

    return HttpResponse.json<ApiSuccessResponse<{ song: SongListItem | undefined }>>({
      status: 'success',
      error: null,
      message: '곡이 수정되었습니다.',
      data: { song: target },
    });
  }),

  // 곡 삭제 (DELETE /songs/:songId)
  http.delete(`${API_URL}/songs/:songId`, ({ params }) => {
    const { songId } = params as { songId: string };
    const index = bandSongs.findIndex((s) => s.id === songId);

    if (index !== -1) {
      bandSongs.splice(index, 1);
    }

    return HttpResponse.json<ApiSuccessResponse<{ success: boolean }>>({
      status: 'success',
      error: null,
      message: '곡이 삭제되었습니다.',
      data: { success: true },
    });
  }),
];
