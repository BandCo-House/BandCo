import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Plus, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { uploadFile } from '@/shared/api';
import { useCreateSong } from '@/entities/song/api/useCreateSong';
import { SONG_KEY_OPTIONS } from '@/entities/song/model/song-key';
import type { SongKey, SongPreview } from '@/entities/song/model/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { SelectField } from '@/shared/ui/select-field';
import { cn } from '@/shared/lib/utils';
import {
  applyManualEntryToForm,
  applyTrackToForm,
  createEmptyForm,
  isBpmValid,
  isFormValid,
  isSongLengthValid,
  toCreateSongRequest,
  type SongFormState,
} from '../model/types';
import { SongCoverField } from './SongCoverField';
import { SongSearchModal } from './SongSearchModal';

interface SongCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bandId: string;
  /** 생성 성공 시 새 곡 ID. 일정 폼에서 방금 만든 곡을 바로 선택하는 데 쓴다. */
  onCreated?: (songId: string) => void;
}

const COVER_FOLDER = 'song-covers';
const REFERENCE_FOLDER = 'song-references';

/** 디자인의 `곡 검색`·`＋링크` 버튼 크기. */
const ACCENT_BUTTON_CLASS = 'h-[46px] gap-1 px-4 typo-base-b';

interface RemovableChipProps {
  label: string;
  removeLabel: string;
  onRemove: () => void;
}

const RemovableChip = ({
  label,
  removeLabel,
  onRemove,
}: RemovableChipProps) => (
  <li className="flex max-w-full items-center gap-1 rounded-full border border-white/24 bg-grey-500/24 py-1 pr-1 pl-3">
    <span className="min-w-0 truncate typo-sm-m text-grey-100">{label}</span>
    <button
      type="button"
      aria-label={removeLabel}
      onClick={onRemove}
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-grey-200 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <X aria-hidden="true" className="size-3.5" />
    </button>
  </li>
);

/**
 * 합주곡 추가(풀스크린). 외부 검색으로 제목·아티스트·앨범아트·곡 길이를 채우고,
 * 조성·BPM·참고 자료·외부 링크는 직접 입력한다. 검색에 없는 곡은 직접 입력으로도 추가할 수 있다.
 */
export const SongCreateModal = ({
  open,
  onOpenChange,
  bandId,
  onCreated,
}: SongCreateModalProps) => {
  const { mutate, isPending } = useCreateSong(bandId);

  const [form, setForm] = useState<SongFormState>(createEmptyForm);
  const [linkDraft, setLinkDraft] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 이미 올린 파일의 objectUrl. 생성이 실패해 다시 제출해도 재업로드하지 않는다.
  const uploadedUrls = useRef(new Map<File, string>());

  // 열릴 때 폼을 초기화한다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(createEmptyForm());
      setLinkDraft('');
      setIsUploading(false);
    }
  }

  // 업로드 캐시는 폼과 수명을 같이 한다(ref는 렌더 중 만질 수 없어 effect에서 비운다).
  useEffect(() => {
    if (open) uploadedUrls.current.clear();
  }, [open]);

  const uploadOnce = async (file: File, folder: string): Promise<string> => {
    const cached = uploadedUrls.current.get(file);
    if (cached) return cached;

    const objectUrl = await uploadFile(file, folder);
    uploadedUrls.current.set(file, objectUrl);
    return objectUrl;
  };

  const { coverPreviewUrl } = form;
  // 미리보기 blob URL은 값이 바뀌거나 언마운트될 때 revoke한다.
  useEffect(() => {
    if (!coverPreviewUrl) return;
    return () => URL.revokeObjectURL(coverPreviewUrl);
  }, [coverPreviewUrl]);

  const update = (patch: Partial<SongFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSelectTrack = (track: SongPreview) =>
    setForm((prev) => applyTrackToForm(prev, track));

  const handleManualEntry = (query: string) =>
    setForm((prev) => applyManualEntryToForm(prev, query));

  const handleSelectCover = (file: File) =>
    update({
      coverSource: 'custom',
      coverFile: file,
      coverPreviewUrl: URL.createObjectURL(file),
    });

  const handleReferenceSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      update({ referenceFiles: [...form.referenceFiles, ...files] });
    }
    event.target.value = '';
  };

  const trimmedLink = linkDraft.trim();
  const canAddLink =
    trimmedLink.length > 0 && !form.externalLinks.includes(trimmedLink);

  const handleAddLink = () => {
    if (!canAddLink) return;
    update({ externalLinks: [...form.externalLinks, trimmedLink] });
    setLinkDraft('');
  };

  const canSubmit = isFormValid(form) && !isPending && !isUploading;

  const uploadAssets = async () => {
    const songCoverUrl =
      form.coverSource === 'album'
        ? (form.track?.albumImageUrl ?? undefined)
        : form.coverSource === 'custom' && form.coverFile
          ? await uploadOnce(form.coverFile, COVER_FOLDER)
          : undefined;

    const referenceFiles = await Promise.all(
      form.referenceFiles.map(async (file) => ({
        fileUrl: await uploadOnce(file, REFERENCE_FOLDER),
        fileName: file.name,
      })),
    );

    return { songCoverUrl, referenceFiles };
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsUploading(true);
    let uploaded: Awaited<ReturnType<typeof uploadAssets>>;
    try {
      uploaded = await uploadAssets();
    } catch {
      toast.error('파일을 업로드하지 못했어요. 잠시 후 다시 시도해주세요.');
      setIsUploading(false);
      return;
    }
    setIsUploading(false);

    mutate(toCreateSongRequest(form, uploaded), {
      onSuccess: (created) => {
        toast.success('합주곡을 추가했어요.');
        onCreated?.(created.song.id);
        onOpenChange(false);
      },
      onError: () => {
        toast.error('합주곡을 추가하지 못했어요. 잠시 후 다시 시도해주세요.');
      },
    });
  };

  const bpmInvalid = !isBpmValid(form.bpm);
  const songLengthInvalid = !isSongLengthValid(form.songLength);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          곡을 검색하거나 직접 입력해 밴드 라이브러리에 합주곡을 추가합니다.
        </SheetDescription>

        <header className="flex items-center bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-9 overflow-y-auto px-5 pt-8 pb-6">
          <div className="flex flex-col gap-2">
            <SheetTitle className="typo-xl-sb text-grey-50">
              합주곡 추가
            </SheetTitle>
            <p className="typo-base-r text-grey-300">
              밴드에서 연습할 합주곡을 검색 ∙ 수정해보세요
            </p>
          </div>

          <Field label="곡 제목" required labelSize="lg" htmlFor="song-title">
            <div className="flex items-center gap-1">
              <Input
                id="song-title"
                variant="underline"
                className="min-w-0 flex-1"
                value={form.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="먼저 곡을 검색해주세요"
                maxLength={200}
              />
              <Button
                type="button"
                variant="accent"
                className={ACCENT_BUTTON_CLASS}
                onClick={() => setIsSearchOpen(true)}
              >
                <Search aria-hidden="true" className="size-[18px]" />곡 검색
              </Button>
            </div>
          </Field>

          <Field label="아티스트" required labelSize="lg" htmlFor="song-artist">
            <Input
              id="song-artist"
              variant="underline"
              value={form.artistName}
              onChange={(event) => update({ artistName: event.target.value })}
              placeholder="먼저 곡을 검색해주세요"
              maxLength={200}
            />
          </Field>

          <SongCoverField
            source={form.coverSource}
            albumImageUrl={form.track?.albumImageUrl ?? null}
            previewUrl={form.coverPreviewUrl}
            onSelectFile={handleSelectCover}
            onResetToAlbum={() =>
              update({
                coverSource: 'album',
                coverFile: null,
                coverPreviewUrl: null,
              })
            }
            onClear={() =>
              update({
                coverSource: 'none',
                coverFile: null,
                coverPreviewUrl: null,
              })
            }
          />

          <div className="flex flex-col gap-2">
            <FieldLabel size="lg">참고 자료</FieldLabel>
            <label className="flex cursor-pointer items-center gap-3 rounded-full field-border border-surface-1 bg-grey-500/24 px-5 py-4 text-grey-300 focus-within:outline-2 focus-within:outline-primary">
              <Upload aria-hidden="true" className="size-6" />
              <span className="typo-base-sb">파일을 선택하세요</span>
              <input
                type="file"
                multiple
                onChange={handleReferenceSelect}
                className="sr-only"
              />
            </label>
            {form.referenceFiles.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {form.referenceFiles.map((file, index) => (
                  <RemovableChip
                    key={`${file.name}-${index}`}
                    label={file.name}
                    removeLabel={`참고 자료 ${file.name} 제거`}
                    onRemove={() =>
                      update({
                        referenceFiles: form.referenceFiles.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                ))}
              </ul>
            )}
          </div>

          <Field label="외부 링크" labelSize="lg" htmlFor="song-link">
            <div className="flex items-center gap-1">
              <Input
                id="song-link"
                type="url"
                variant="underline"
                className="min-w-0 flex-1"
                value={linkDraft}
                onChange={(event) => setLinkDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  handleAddLink();
                }}
                placeholder="https://"
              />
              <Button
                type="button"
                variant="accent"
                className={ACCENT_BUTTON_CLASS}
                disabled={!canAddLink}
                onClick={handleAddLink}
              >
                <Plus aria-hidden="true" className="size-[18px]" />
                링크
              </Button>
            </div>
            {form.externalLinks.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {form.externalLinks.map((link) => (
                  <RemovableChip
                    key={link}
                    label={link}
                    removeLabel={`외부 링크 ${link} 제거`}
                    onRemove={() =>
                      update({
                        externalLinks: form.externalLinks.filter(
                          (item) => item !== link,
                        ),
                      })
                    }
                  />
                ))}
              </ul>
            )}
          </Field>

          <Field label="조성" labelSize="lg" htmlFor="song-key">
            <SelectField
              id="song-key"
              ariaLabel="조성 선택"
              value={form.songKey}
              onValueChange={(songKey) =>
                update({ songKey: songKey as SongKey })
              }
              options={SONG_KEY_OPTIONS}
              placeholder="조성을 선택하세요"
            />
          </Field>

          <Field label="BPM" labelSize="lg" htmlFor="song-bpm">
            <Input
              id="song-bpm"
              variant="underline"
              inputMode="numeric"
              value={form.bpm}
              onChange={(event) => update({ bpm: event.target.value })}
              placeholder="120"
              aria-invalid={bpmInvalid || undefined}
              aria-describedby={bpmInvalid ? 'song-bpm-error' : undefined}
            />
            {bpmInvalid && (
              <p id="song-bpm-error" className="typo-sm-r text-destructive">
                BPM은 1~999 사이 숫자로 입력해주세요.
              </p>
            )}
          </Field>

          <Field label="곡 길이" labelSize="lg" htmlFor="song-length">
            <Input
              id="song-length"
              variant="underline"
              value={form.songLength}
              onChange={(event) => update({ songLength: event.target.value })}
              placeholder="4:37"
              aria-invalid={songLengthInvalid || undefined}
              aria-describedby={
                songLengthInvalid ? 'song-length-error' : undefined
              }
            />
            {songLengthInvalid && (
              <p id="song-length-error" className="typo-sm-r text-destructive">
                곡 길이는 4:37 형식으로 입력해주세요.
              </p>
            )}
          </Field>
        </div>

        <div
          className={cn(
            'flex items-center justify-end gap-3 bg-gradient-top/65 px-5 py-4',
            'pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm',
          )}
        >
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-grey-200 text-grey-100"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="shining"
            size="lg"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            추가
          </Button>
        </div>

        <SongSearchModal
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          onSelect={handleSelectTrack}
          onManualEntry={handleManualEntry}
        />
      </SheetContent>
    </Sheet>
  );
};
