import { useState } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X } from 'lucide-react';
import { useGenres } from '@/entities/genre';
import { updateUserProfile } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { TagSelectBottomSheet } from './TagSelectBottomSheet';

export interface GenreEditSectionProps {
  isMe: boolean;
  userId: string;
  favoriteGenres: Profile['favoriteGenres'];
}

export function GenreEditSection({
  isMe,
  userId,
  favoriteGenres,
}: GenreEditSectionProps) {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 시트가 열릴 때만 Lazy Loading으로 전체 장르 목록 로드
  const genresQuery = useGenres(isSheetOpen);
  const availableGenres = genresQuery.data || [];

  const handleSaveGenres = async (newGenreIds: string[]) => {
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
      toast.success('선호 장르가 저장되었습니다.');
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('장르 저장 도중 에러가 발생했습니다.');
    } finally {
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const removeGenre = async (genreId: string) => {
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
      toast.success('선호 장르가 삭제되었습니다.');
    } catch {
      if (previousProfile) {
        queryClient.setQueryData(queryKey, previousProfile);
      }
      toast.error('장르 삭제 도중 에러가 발생했습니다.');
    } finally {
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
        {favoriteGenres.map((genre) => (
          <span
            key={genre.genreId}
            className="flex items-center rounded-full border border-surface-2 px-4 py-1.5 typo-base-sb"
          >
            {genre.name}
            {isMe && (
              <button
                type="button"
                aria-label={`${genre.name} 삭제`}
                onClick={() => removeGenre(genre.genreId)}
                className="-my-2 -mr-3 ml-1 rounded-full p-2 text-grey-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && (
          <Button
            aria-label="선호 장르 수정"
            onClick={() => setIsSheetOpen(true)}
            size="icon"
            className="size-9 cursor-pointer bg-surface-1/40"
          >
            <Plus className="size-4 text-primary" />
          </Button>
        )}
        {favoriteGenres.length === 0 && (
          <span className="typo-sm-r text-slate-400">
            등록된 선호 장르가 없습니다.
          </span>
        )}
      </div>

      <TagSelectBottomSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        title="선호 장르"
        items={availableGenres}
        selectedIds={favoriteGenres.map((g) => g.genreId)}
        isLoading={genresQuery.isLoading}
        onSave={handleSaveGenres}
      />
    </section>
  );
}
