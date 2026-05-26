/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import type { Profile } from '@/entities/profile/model/types';
import { Button } from '@/shared/ui/button';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSkillTypes } from '@/entities/skill';
import { useGenres } from '@/entities/genre';
import type { SkillLevel } from '../api/profile-api';

export interface SkillGenreEditSectionProps {
  isEditing: boolean;
  skills: Profile['skills'];
  favoriteGenres: Profile['favoriteGenres'];
  editSkills: Profile['skills'];
  editGenres: Profile['favoriteGenres'];
  onSetEditSkills: (skills: Profile['skills']) => void;
  onSetEditGenres: (genres: Profile['favoriteGenres']) => void;
}

export function SkillGenreEditSection({
  isEditing,
  skills,
  favoriteGenres,
  editSkills,
  editGenres,
  onSetEditSkills,
  onSetEditGenres,
}: SkillGenreEditSectionProps) {
  // Fetch available metadata on-demand (only when isEditing is true)
  const skillsQuery = useSkillTypes(isEditing);
  const genresQuery = useGenres(isEditing);

  const availableSkills = skillsQuery.data || [];
  const availableGenres = genresQuery.data || [];

  // Skill editing form state
  const [newSkillId, setNewSkillId] = useState<string>('guitar-1');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('BEGINNER');

  // Genre editing form state
  const [newGenreId, setNewGenreId] = useState<string>('genre-rock');

  // Sync default selection values when data loads
  useEffect(() => {
    if (skillsQuery.data && skillsQuery.data.length > 0) {
      setNewSkillId(skillsQuery.data[0].id);
    }
  }, [skillsQuery.data]);

  useEffect(() => {
    if (genresQuery.data && genresQuery.data.length > 0) {
      setNewGenreId(genresQuery.data[0].id);
    }
  }, [genresQuery.data]);

  // Add/Remove Skill & Genre helper functions
  const addSkill = () => {
    const exists = editSkills.some((s) => s.skillTypeId === newSkillId);
    if (exists) {
      toast.warning('이미 등록된 파트입니다.');
      return;
    }

    const skillObj = availableSkills.find((s) => s.id === newSkillId);
    if (!skillObj) return;

    const newSkillItem = {
      skillTypeId: newSkillId,
      skillName: skillObj.name,
      level: newSkillLevel,
      isPrimary: editSkills.length === 0, // Automatically primary if first
    };

    onSetEditSkills([...editSkills, newSkillItem]);
  };

  const removeSkill = (skillTypeId: string) => {
    const updated = editSkills.filter((s) => s.skillTypeId !== skillTypeId);
    // If we removed the primary skill and have skills left, set first as primary
    if (
      editSkills.find((s) => s.skillTypeId === skillTypeId)?.isPrimary &&
      updated.length > 0
    ) {
      updated[0].isPrimary = true;
    }
    onSetEditSkills(updated);
  };

  const addGenre = () => {
    const exists = editGenres.some((g) => g.genreId === newGenreId);
    if (exists) {
      toast.warning('이미 등록된 선호 장르입니다.');
      return;
    }

    const genreObj = availableGenres.find((g) => g.id === newGenreId);
    if (!genreObj) return;

    onSetEditGenres([
      ...editGenres,
      { genreId: newGenreId, name: genreObj.name },
    ]);
  };

  const removeGenre = (genreId: string) => {
    onSetEditGenres(editGenres.filter((g) => g.genreId !== genreId));
  };

  return (
    <div className="grid grid-cols-1 gap-6 text-grey-50 md:grid-cols-2">
      {/* Play Parts (Skills) Card */}
      <div className="flex flex-col rounded-3xl bg-[#65637A] p-4 backdrop-blur-xl transition-all duration-300">
        <h3 className="mb-2.5 typo-base-b">플레이 파트</h3>

        {isEditing ? (
          <div className="space-y-4">
            {/* Current skills with remove button */}
            <div className="flex flex-wrap gap-2.5">
              {editSkills.map((skill) => (
                <span
                  key={skill.skillTypeId}
                  className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 typo-sm-m text-violet-300 shadow-sm"
                >
                  {skill.skillName}

                  <button
                    onClick={() => removeSkill(skill.skillTypeId)}
                    className="rounded-full p-0.5 text-violet-400 transition-colors hover:bg-violet-500/20"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {editSkills.length === 0 && (
                <span className="typo-sm-r text-slate-500">
                  아직 선택한 악기 파트가 없습니다.
                </span>
              )}
            </div>

            {/* Add new skill selectors */}
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
              <div className="flex gap-2">
                {skillsQuery.isLoading ? (
                  <div className="flex-1 py-2 text-center text-xs text-slate-400">
                    악기 파트 목록을 불러오는 중...
                  </div>
                ) : (
                  <select
                    value={newSkillId}
                    onChange={(e) => setNewSkillId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                  >
                    {availableSkills.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={newSkillLevel}
                  onChange={(e) =>
                    setNewSkillLevel(e.target.value as SkillLevel)
                  }
                  className="rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                >
                  <option value="BEGINNER">초보자</option>
                  <option value="INTERMEDIATE">중급자</option>
                  <option value="ADVANCED">숙련자</option>
                </select>
              </div>
              <Button
                size="sm"
                onClick={addSkill}
                className="mt-1 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                disabled={skillsQuery.isLoading}
              >
                <Plus className="mr-1 size-4" /> 파트 추가
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {skills.map((skill) => (
              <span
                key={skill.skillTypeId}
                className={`rounded-full border px-4 py-2 typo-sm-m transition-all duration-300 hover:scale-105 ${
                  skill.isPrimary
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-300 shadow-md shadow-violet-500/5'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300'
                }`}
              >
                {skill.skillName}
              </span>
            ))}
            {skills.length === 0 && (
              <span className="typo-sm-r text-slate-500">
                등록된 플레이 파트가 없습니다.
              </span>
            )}

            {/* Elegant Plus button symbol in visual match with the mockup */}
            <span className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 transition-all hover:border-violet-500/50 hover:bg-slate-700/60 hover:text-white">
              <Plus className="size-4" />
            </span>
          </div>
        )}
      </div>

      {/* Favorite Genres Card */}
      <div className="flex flex-col rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10">
        <h3 className="mb-4 typo-sm-b tracking-wider text-slate-400">
          선호 장르
        </h3>

        {isEditing ? (
          <div className="space-y-4">
            {/* Current genres with remove button */}
            <div className="flex flex-wrap gap-2.5">
              {editGenres.map((genre) => (
                <span
                  key={genre.genreId}
                  className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-2 typo-sm-m text-violet-300 shadow-sm"
                >
                  {genre.name}
                  <button
                    onClick={() => removeGenre(genre.genreId)}
                    className="rounded-full p-0.5 text-violet-400 transition-colors hover:bg-violet-500/20"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
              {editGenres.length === 0 && (
                <span className="typo-sm-r text-slate-500">
                  아직 선택한 선호 장르가 없습니다.
                </span>
              )}
            </div>

            {/* Add new genre selectors */}
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
              <div className="flex gap-2">
                {genresQuery.isLoading ? (
                  <div className="flex-1 py-2 text-center text-xs text-slate-400">
                    장르 목록을 불러오는 중...
                  </div>
                ) : (
                  <select
                    value={newGenreId}
                    onChange={(e) => setNewGenreId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 p-2 typo-sm-r text-slate-200"
                  >
                    {availableGenres.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button
                size="sm"
                onClick={addGenre}
                className="mt-1 w-full rounded-xl bg-violet-600 text-white hover:bg-violet-500"
                disabled={genresQuery.isLoading}
              >
                <Plus className="mr-1 size-4" /> 장르 추가
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            {favoriteGenres.map((genre) => (
              <span
                key={genre.genreId}
                className="rounded-full border border-slate-800 bg-slate-900/40 px-4 py-2 typo-sm-m text-slate-300 transition-all duration-300 hover:scale-105"
              >
                {genre.name}
              </span>
            ))}
            {favoriteGenres.length === 0 && (
              <span className="typo-sm-r text-slate-500">
                등록된 선호 장르가 없습니다.
              </span>
            )}

            {/* Elegant Plus button symbol in visual match with the mockup */}
            <span className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 transition-all hover:border-violet-500/50 hover:bg-slate-700/60 hover:text-white">
              <Plus className="size-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
