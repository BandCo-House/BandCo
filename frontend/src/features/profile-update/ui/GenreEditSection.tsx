import { useState } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { useGenres } from '@/entities/genre';
import { updateUserProfile } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

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
  const [isAdding, setIsAdding] = useState(false);
  const [newGenreId, setNewGenreId] = useState<string | null>(null);

  // isAdding이 true일 때만 지연 쿼리 패칭 발동
  const genresQuery = useGenres(isAdding);
  const availableGenres = genresQuery.data || [];

  // 데이터 로딩 완료 시 첫 번째 항목의 id를 자연스럽게 기본 파생 상태(Derived State 🌟)로 제공
  const selectedGenreId = newGenreId || availableGenres[0]?.id || '';

  const addGenre = async () => {
    const exists = favoriteGenres.some((g) => g.genreId === selectedGenreId);
    if (exists) {
      toast.warning('이미 등록된 선호 장르입니다.');
      return;
    }
    const genreObj = availableGenres.find((g) => g.id === selectedGenreId);
    if (!genreObj) return;

    const updatedGenres = [
      ...favoriteGenres.map((g) => g.genreId),
      selectedGenreId,
    ];

    try {
      await updateUserProfile(userId, { favoriteGenres: updatedGenres });
      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', userId],
      });
      toast.success('선호 장르가 추가되었습니다.');
      setNewGenreId(null);
      setIsAdding(false);
    } catch {
      toast.error('장르 추가 도중 에러가 발생했습니다.');
    }
  };

  const removeGenre = async (genreId: string) => {
    const updatedGenres = favoriteGenres
      .filter((g) => g.genreId !== genreId)
      .map((g) => g.genreId);

    try {
      await updateUserProfile(userId, { favoriteGenres: updatedGenres });
      queryClient.invalidateQueries({
        queryKey: ['user-profiles', 'detail', userId],
      });
      toast.success('선호 장르가 삭제되었습니다.');
    } catch {
      toast.error('장르 삭제 도중 에러가 발생했습니다.');
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
        {isMe && !isAdding && (
          <Button
            aria-label="선호 장르 추가"
            onClick={() => setIsAdding(true)}
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

      {isAdding && isMe && (
        <div className="absolute top-full right-4 left-4 z-40 -mt-2 flex flex-col gap-2 rounded-md border border-grey-50/20 bg-surface-3 p-3 shadow-2xl backdrop-blur-xl">
          {genresQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 typo-xs-m text-grey-200">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>장르 목록을 불러오는 중...</span>
            </div>
          ) : (
            <>
              <Select value={selectedGenreId} onValueChange={setNewGenreId}>
                <SelectTrigger>
                  <SelectValue placeholder="장르 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableGenres.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={addGenre}
                  variant="neutral"
                  className="flex-1 py-2 typo-sm-sb"
                >
                  추가
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewGenreId(null);
                    setIsAdding(false);
                  }}
                  className="rounded-full border-grey-50/40 text-grey-100 hover:bg-white/12"
                >
                  취소
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
