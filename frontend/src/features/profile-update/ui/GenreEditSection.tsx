import { useState, useRef } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X } from 'lucide-react';
import { useGenres } from '@/entities/genre';
import { updateUserProfile } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import PinIcon from '@/assets/icons/pin.svg?react';
import { TagSelectBottomSheet } from './TagSelectBottomSheet';

export interface GenreEditSectionProps {
  isMe: boolean;
  userId: string;
  favoriteGenres: Profile['favoriteGenres'];
}

/** 장르 편집 토스트도 하나만 — 이유는 SkillEditSection의 SKILL_TOAST와 같다. */
const GENRE_TOAST = { id: 'profile-genre', closeButton: true } as const;

export function GenreEditSection({
  isMe,
  userId,
  favoriteGenres,
}: GenreEditSectionProps) {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isUpdatingRef = useRef(false);

  // 시트가 열릴 때만 Lazy Loading으로 전체 장르 목록 로드
  const genresQuery = useGenres(isSheetOpen);
  const availableGenres = genresQuery.data || [];

  const handleSaveGenres = async (newGenreIds: string[]) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsUpdating(true);

    const queryKey = ['user-profiles', 'detail', userId];
    await queryClient.cancelQueries({ queryKey });
    const previousProfile = queryClient.getQueryData<Profile>(queryKey);

    // 낙관적 업데이트
    if (previousProfile) {
      const optimisticGenres = newGenreIds.map((id) => {
        const existing = favoriteGenres.find((g) => g.genreId === id);
        const meta = availableGenres.find((item) => item.id === id);
        return {
          genreId: id,
          name: meta?.name ?? existing?.name ?? '',
        };
      });

      queryClient.setQueryData<Profile>(queryKey, {
        ...previousProfile,
        favoriteGenres: optimisticGenres,
      });
    }

    try {
      await updateUserProfile(userId, { favoriteGenres: newGenreIds });
      toast.success('선호 장르가 저장되었습니다.', GENRE_TOAST);
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('장르 저장 도중 에러가 발생했습니다.', GENRE_TOAST);
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const removeGenre = async (genreId: string) => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    setIsUpdating(true);

    const queryKey = ['user-profiles', 'detail', userId];
    await queryClient.cancelQueries({ queryKey });
    const previousProfile = queryClient.getQueryData<Profile>(queryKey);

    const updatedGenres = favoriteGenres
      .filter((g) => g.genreId !== genreId)
      .map((g) => g.genreId);

    if (previousProfile) {
      queryClient.setQueryData<Profile>(queryKey, {
        ...previousProfile,
        favoriteGenres: favoriteGenres.filter((g) => g.genreId !== genreId),
      });
    }

    try {
      await updateUserProfile(userId, { favoriteGenres: updatedGenres });
      toast.success('선호 장르가 삭제되었습니다.', GENRE_TOAST);
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('장르 삭제 도중 에러가 발생했습니다.', GENRE_TOAST);
    } finally {
      isUpdatingRef.current = false;
      setIsUpdating(false);
      queryClient.invalidateQueries({ queryKey });
    }
  };

  return (
    <section
      aria-labelledby="profile-genre-title"
      className="relative flex flex-col items-start gap-2.5 self-stretch rounded-md bg-surface-3 p-4 text-grey-50"
    >
      <h2 id="profile-genre-title" className="typo-base-b">
        선호 장르
      </h2>

      <div className="flex flex-wrap gap-2.5">
        {favoriteGenres.map((genre, index) => (
          <span
            key={genre.genreId}
            className="flex items-center gap-1.5 rounded-full border border-surface-2 px-4 py-1.5 typo-base-sb"
          >
            {/* 첫 칩이 대표다(장르는 서버 플래그가 없어 배열 순서가 곧 대표). 바텀시트와 같은 핀으로 표시한다. */}
            {index === 0 && (
              <PinIcon
                aria-hidden="true"
                data-slot="svg-icon"
                className="size-4 shrink-0"
              />
            )}
            {genre.name}
            {isMe && (
              <button
                type="button"
                aria-label={`${genre.name} 삭제`}
                disabled={isUpdating}
                onClick={() => removeGenre(genre.genreId)}
                className="-my-2 -mr-3 ml-1 rounded-full p-2 text-grey-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && (
          <Button
            aria-label="선호 장르 수정"
            disabled={isUpdating}
            onClick={() => setIsSheetOpen(true)}
            size="icon"
            className="size-9 cursor-pointer bg-surface-1"
          >
            <Plus className="size-4 text-primary" />
          </Button>
        )}
        {favoriteGenres.length === 0 && (
          <span className="typo-sm-r text-grey-300">
            등록된 선호 장르가 없습니다.
          </span>
        )}
      </div>

      <TagSelectBottomSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="선호 장르"
        // 장르는 서버에 대표 플래그가 없다(favoriteGenres에 id 배열만 보낸다).
        // 디자인은 파트와 같은 칩을 쓰므로 첫 칩에 핀이 붙는다 — "첫 번째 = 대표"라는
        // 표시 규칙은 프론트가 배열 순서로 지킨다.
        description="핀 표시가 대표 장르가 되고, 나머지는 번호순으로 프로필에 보여요."
        items={availableGenres}
        selectedIds={favoriteGenres.map((g) => g.genreId)}
        // isLoading은 disabled 쿼리(시트 닫힘→첫 열림 프레임)에서 false라 빈 상태가 먼저 번쩍인다
        isLoading={genresQuery.isPending}
        isError={genresQuery.isError}
        onSave={handleSaveGenres}
      />
    </section>
  );
}
