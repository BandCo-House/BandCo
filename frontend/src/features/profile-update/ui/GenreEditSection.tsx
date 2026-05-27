import { useState } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X, Loader2 } from 'lucide-react';
import { useGenres } from '@/entities/genre';
import { updateUserProfile } from '../api/profile-api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    <div className="flex flex-col rounded-3xl border border-grey-500 bg-[#65637A]/48 p-4 text-grey-50 backdrop-blur-xl transition-all duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="typo-base-b">선호 장르</h3>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {favoriteGenres.map((genre) => (
          <span
            key={genre.genreId}
            className="flex items-center rounded-full border border-[#61759E]/56 px-4 py-1.5 typo-base-sb"
          >
            {genre.name}
            {isMe && (
              <button
                onClick={() => removeGenre(genre.genreId)}
                className="ml-2 rounded-full text-[#65637A] transition-colors hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            )}
          </span>
        ))}
        {isMe && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 transition-all hover:border-violet-500/50 hover:bg-slate-700/60 hover:text-white"
          >
            <Plus className="size-4" />
          </button>
        )}
        {favoriteGenres.length === 0 && (
          <span className="typo-sm-r text-slate-400">
            등록된 선호 장르가 없습니다.
          </span>
        )}
      </div>

      {isAdding && isMe && (
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
          {genresQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
              <Loader2 className="size-4 animate-spin text-violet-400" />
              <span>장르 목록을 불러오는 중...</span>
            </div>
          ) : (
            <>
              <select
                value={selectedGenreId}
                onChange={(e) => setNewGenreId(e.target.value)}
                className="animate-fadeIn flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
              >
                {availableGenres.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  onClick={addGenre}
                  className="flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-500"
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
                  className="rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  취소
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
