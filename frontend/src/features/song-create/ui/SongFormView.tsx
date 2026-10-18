import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Plus, Search, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadFile } from '@/shared/api';
import { getLinkPreview } from '@/entities/link/api/link-api';
import { linkKeys } from '@/entities/link/api/useLinkPreview';
import { useUpdateSong } from '@/entities/song/api/useUpdateSong';
import { formatSongLength, parseSongLength } from '@/entities/song/lib/song-length';
import { SONG_KEY_OPTIONS } from '@/entities/song/model/song-key';
import type { SongKey, SongListItem, SongPreview } from '@/entities/song/model/types';
import { SheetTitle } from '@/shared/ui/sheet';
import { CROP_ASPECT, ImageCropDialog } from '@/shared/ui/image-crop-dialog';
import { useImageCrop } from '@/shared/lib/use-image-crop';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { SelectField } from '@/shared/ui/select-field';
import { cn } from '@/shared/lib/utils';
import {
  applyManualEntryToForm,
  applyTrackToForm,
  applyVideoPreviewToForm,
  getOriginalCoverUrl,
  isBpmValid,
  isExternalLinkValid,
  isSongLengthValid,
  type SongFormState,
} from '../model/types';
import { SongCoverField } from './SongCoverField';
import { SongSearchModal } from './SongSearchModal';

interface SongFormViewProps {
  song: SongListItem;
  onCancel: () => void;
  onSaved: () => void;
}

const COVER_FOLDER = 'song-covers';
const REFERENCE_FOLDER = 'song-references';
const SEARCH_FIRST_PLACEHOLDER = '먼저 곡을 검색해주세요';
const VIDEO_LINK_HINT_ID = 'song-video-link-hint-edit';
const VIDEO_LINK_ERROR_ID = 'song-video-link-error-edit';

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
  <li className="flex max-w-full items-center gap-1 rounded-full bg-grey-500/24 glass-surface py-1 pr-1 pl-3">
    <span className="min-w-0 truncate typo-sm-sb text-grey-100">{label}</span>
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
 * 합주곡 수정 폼(본문 + 하단 버튼). SongDetailModal 풀스크린 시트 안에 넣어 쓴다.
 * 디자인과 레이아웃은 SongCreateModal과 100% 동일한 체계를 유지한다.
 */
export const SongFormView = ({
  song,
  onCancel,
  onSaved,
}: SongFormViewProps) => {
  const { mutate: updateSongMutate, isPending } = useUpdateSong();
  const { selectFile, cropDialogProps } = useImageCrop();
  const queryClient = useQueryClient();

  // 기존 저장된 참고자료 목록 (유지/삭제)
  const [existingFiles, setExistingFiles] = useState(song.referenceFiles ?? []);

  const [form, setForm] = useState<SongFormState>(() => ({
    title: song.title,
    artistName: song.artistName,
    track: song.externalTrackId
      ? {
          externalTrackId: song.externalTrackId,
          title: song.title,
          artistName: song.artistName,
          albumName: '',
          albumImageUrl: song.songCoverUrl,
          releaseDate: null,
          durationMs: (song.songLength ?? 0) * 1000,
          previewUrl: null,
          sourceUrl: song.sourceUrl ?? '',
          sourceType: song.sourceType ?? 'SPOTIFY',
        }
      : null,
    isManualEntry: !song.externalTrackId,
    linkCoverUrl: null,
    coverSource: song.songCoverUrl
      ? song.externalTrackId
        ? 'album'
        : 'custom'
      : 'none',
    coverFile: null,
    coverPreviewUrl: song.songCoverUrl,
    referenceFiles: [],
    externalLinks: [...(song.externalLinks ?? [])],
    songKey: song.key,
    bpm: song.bpm !== null && song.bpm !== undefined ? String(song.bpm) : '',
    songLength: formatSongLength(song.songLength),
  }));

  const [linkDraft, setLinkDraft] = useState('');
  const [videoLinkDraft, setVideoLinkDraft] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadedUrls = useRef(new Map<File, string>());

  const uploadOnce = async (file: File, folder: string): Promise<string> => {
    const cached = uploadedUrls.current.get(file);
    if (cached) return cached;
    const objectUrl = await uploadFile(file, folder);
    uploadedUrls.current.set(file, objectUrl);
    return objectUrl;
  };

  const { coverPreviewUrl } = form;
  useEffect(() => {
    if (!coverPreviewUrl || coverPreviewUrl.startsWith('http')) return;
    return () => URL.revokeObjectURL(coverPreviewUrl);
  }, [coverPreviewUrl]);

  const update = (patch: Partial<SongFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSelectTrack = (track: SongPreview) =>
    setForm((prev) => applyTrackToForm(prev, track));

  const handleManualEntry = () =>
    setForm((prev) => applyManualEntryToForm(prev));

  const trimmedVideoLink = videoLinkDraft.trim();
  const isVideoLinkMalformed =
    trimmedVideoLink.length > 0 && !isExternalLinkValid(trimmedVideoLink);
  const canLoadVideo =
    trimmedVideoLink.length > 0 && !isVideoLinkMalformed && !isLoadingVideo;

  const handleLoadVideo = async () => {
    if (!canLoadVideo) return;
    setIsLoadingVideo(true);
    try {
      const preview = await queryClient.fetchQuery({
        queryKey: linkKeys.preview(trimmedVideoLink),
        queryFn: () => getLinkPreview(trimmedVideoLink),
      });
      if (!preview.title) {
        toast.error(
          '영상 정보를 불러오지 못했어요. 제목과 아티스트를 직접 입력해주세요.',
        );
        return;
      }
      setForm((prev) => applyVideoPreviewToForm(prev, preview));
      setVideoLinkDraft('');
      toast.success('영상 정보로 채웠어요. 제목과 아티스트를 확인해주세요.');
    } catch {
      toast.error('영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const applyCroppedCover = (file: File) =>
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
  const isLinkDuplicated = form.externalLinks.includes(trimmedLink);
  const isLinkMalformed =
    trimmedLink.length > 0 && !isExternalLinkValid(trimmedLink);
  const canAddLink =
    trimmedLink.length > 0 && !isLinkDuplicated && !isLinkMalformed;

  const handleAddLink = () => {
    if (!canAddLink) return;
    update({ externalLinks: [...form.externalLinks, trimmedLink] });
    setLinkDraft('');
  };

  const bpmInvalid = !isBpmValid(form.bpm);
  const songLengthInvalid = !isSongLengthValid(form.songLength);
  const isTitleValid = form.title.trim().length > 0;
  const isArtistValid = form.artistName.trim().length > 0;
  const canSubmit =
    isTitleValid &&
    isArtistValid &&
    !bpmInvalid &&
    !songLengthInvalid &&
    !isPending &&
    !isUploading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsUploading(true);
    let finalCoverUrl: string | null = null;
    let newRefFiles: { fileUrl: string; fileName: string }[] = [];

    try {
      if (form.coverSource === 'album') {
        finalCoverUrl = getOriginalCoverUrl(form) ?? null;
      } else if (form.coverSource === 'custom') {
        if (form.coverFile) {
          finalCoverUrl = await uploadOnce(form.coverFile, COVER_FOLDER);
        } else {
          finalCoverUrl = form.coverPreviewUrl;
        }
      } else {
        finalCoverUrl = null;
      }

      newRefFiles = await Promise.all(
        form.referenceFiles.map(async (file) => ({
          fileUrl: await uploadOnce(file, REFERENCE_FOLDER),
          fileName: file.name,
        })),
      );
    } catch {
      toast.error('파일을 업로드하지 못했어요. 잠시 후 다시 시도해주세요.');
      setIsUploading(false);
      return;
    }
    setIsUploading(false);

    const mergedReferenceFiles = [
      ...existingFiles.map((f) => ({ fileUrl: f.fileUrl, fileName: f.fileName })),
      ...newRefFiles,
    ];

    const parsedBpm =
      form.bpm.trim().length > 0 ? Number(form.bpm.trim()) : null;
    const parsedLength =
      form.songLength.trim().length > 0
        ? parseSongLength(form.songLength)
        : null;

    updateSongMutate(
      {
        songId: song.id,
        data: {
          title: form.title.trim(),
          artistName: form.artistName.trim(),
          key: form.songKey,
          bpm: parsedBpm,
          songLength: parsedLength,
          songCoverUrl: finalCoverUrl,
          externalLinks: form.externalLinks,
          referenceFiles: mergedReferenceFiles,
          sourceUrl: form.track?.sourceUrl ?? song.sourceUrl,
          sourceType: form.track?.sourceType ?? song.sourceType,
        },
      },
      {
        onSuccess: () => {
          toast.success('합주곡을 수정했어요.');
          onSaved();
        },
        onError: () => {
          toast.error('합주곡을 수정하지 못했어요. 잠시 후 다시 시도해주세요.');
        },
      },
    );
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-9 overflow-y-auto px-5 pt-8 pb-6">
        <div className="flex flex-col gap-2">
          <SheetTitle className="typo-xl-sb text-grey-50">
            합주곡 수정
          </SheetTitle>
          <p className="typo-base-r text-grey-300">
            {form.isManualEntry
              ? '곡 정보를 확인하고 수정해보세요'
              : '밴드에서 연습할 합주곡을 검색 ∙ 수정해보세요'}
          </p>
        </div>

        {form.isManualEntry && (
          <Field
            label="유튜브 링크로 채우기"
            labelSize="lg"
            htmlFor="song-video-link-edit"
          >
            <div className="flex items-center gap-1">
              <Input
                id="song-video-link-edit"
                type="url"
                variant="underline"
                className="min-w-0 flex-1"
                value={videoLinkDraft}
                onChange={(event) => setVideoLinkDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  void handleLoadVideo();
                }}
                placeholder="유튜브 링크를 붙여넣으세요"
                aria-invalid={isVideoLinkMalformed || undefined}
                aria-describedby={
                  isVideoLinkMalformed
                    ? VIDEO_LINK_ERROR_ID
                    : VIDEO_LINK_HINT_ID
                }
              />
              <Button
                type="button"
                variant="accent"
                size="inline"
                disabled={!canLoadVideo}
                onClick={() => void handleLoadVideo()}
              >
                {isLoadingVideo ? '불러오는 중' : '불러오기'}
              </Button>
            </div>
            {isVideoLinkMalformed ? (
              <p
                id={VIDEO_LINK_ERROR_ID}
                className="typo-sm-r text-destructive"
              >
                http:// 또는 https:// 로 시작하는 주소를 입력해주세요.
              </p>
            ) : (
              <p
                id={VIDEO_LINK_HINT_ID}
                className="typo-sm-r break-keep text-grey-300"
              >
                링크를 붙여넣으면 제목·아티스트·커버를 채워드려요. 링크가
                없으면 아래에 직접 입력하세요.
              </p>
            )}
          </Field>
        )}

        <Field label="곡 제목" required labelSize="lg" htmlFor="song-title-edit">
          <div className="flex items-center gap-1">
            <Input
              id="song-title-edit"
              variant="underline"
              className="min-w-0 flex-1"
              value={form.title}
              onChange={(event) => update({ title: event.target.value })}
              placeholder={
                form.isManualEntry
                  ? '곡 제목을 입력하세요'
                  : SEARCH_FIRST_PLACEHOLDER
              }
              maxLength={200}
            />
            <Button
              type="button"
              variant="accent"
              size="inline"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search aria-hidden="true" className="size-[18px]" />곡 검색
            </Button>
          </div>
        </Field>

        <Field label="아티스트" required labelSize="lg" htmlFor="song-artist-edit">
          <Input
            id="song-artist-edit"
            variant="underline"
            value={form.artistName}
            onChange={(event) => update({ artistName: event.target.value })}
            placeholder={
              form.isManualEntry
                ? '아티스트를 입력하세요'
                : SEARCH_FIRST_PLACEHOLDER
            }
            maxLength={200}
          />
        </Field>

        <SongCoverField
          source={form.coverSource}
          albumImageUrl={getOriginalCoverUrl(form)}
          previewUrl={form.coverPreviewUrl}
          onSelectFile={selectFile}
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
          <label className="flex cursor-pointer items-center gap-3 rounded-full bg-grey-500/24 glass-surface px-5 py-4 text-grey-300 focus-within:outline-2 focus-within:outline-primary">
            <Upload aria-hidden="true" className="size-6" />
            <span className="typo-base-sb">파일을 선택하세요</span>
            <input
              type="file"
              multiple
              onChange={handleReferenceSelect}
              className="sr-only"
            />
          </label>
          {(existingFiles.length > 0 || form.referenceFiles.length > 0) && (
            <ul className="flex flex-wrap gap-2">
              {existingFiles.map((file) => (
                <RemovableChip
                  key={file.id}
                  label={file.fileName}
                  removeLabel={`참고 자료 ${file.fileName} 제거`}
                  onRemove={() =>
                    setExistingFiles((prev) =>
                      prev.filter((f) => f.id !== file.id),
                    )
                  }
                />
              ))}
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

        <Field label="외부 링크" labelSize="lg" htmlFor="song-link-edit">
          <div className="flex items-center gap-1">
            <Input
              id="song-link-edit"
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
              aria-invalid={isLinkMalformed || undefined}
              aria-describedby={
                isLinkMalformed ? 'song-link-error-edit' : undefined
              }
            />
            <Button
              type="button"
              variant="accent"
              size="inline"
              disabled={!canAddLink}
              onClick={handleAddLink}
            >
              <Plus aria-hidden="true" className="size-[18px]" />
              링크
            </Button>
          </div>
          {isLinkMalformed && (
            <p id="song-link-error-edit" className="typo-sm-r text-destructive">
              http:// 또는 https:// 로 시작하는 주소를 입력해주세요.
            </p>
          )}
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

        <Field label="조성" labelSize="lg" htmlFor="song-key-edit">
          <SelectField
            id="song-key-edit"
            ariaLabel="조성 선택"
            value={form.songKey}
            onValueChange={(songKey) =>
              update({ songKey: songKey as SongKey })
            }
            options={SONG_KEY_OPTIONS}
            placeholder="조성을 선택하세요"
          />
        </Field>

        <Field label="BPM" labelSize="lg" htmlFor="song-bpm-edit">
          <Input
            id="song-bpm-edit"
            variant="underline"
            inputMode="numeric"
            value={form.bpm}
            onChange={(event) => update({ bpm: event.target.value })}
            placeholder="120"
            aria-invalid={bpmInvalid || undefined}
            aria-describedby={bpmInvalid ? 'song-bpm-error-edit' : undefined}
          />
          {bpmInvalid && (
            <p id="song-bpm-error-edit" className="typo-sm-r text-destructive">
              BPM은 1~999 사이 숫자로 입력해주세요.
            </p>
          )}
        </Field>

        <Field label="곡 길이" labelSize="lg" htmlFor="song-length-edit">
          <Input
            id="song-length-edit"
            variant="underline"
            value={form.songLength}
            onChange={(event) => update({ songLength: event.target.value })}
            placeholder="4:37"
            aria-invalid={songLengthInvalid || undefined}
            aria-describedby={
              songLengthInvalid ? 'song-length-error-edit' : undefined
            }
          />
          {songLengthInvalid && (
            <p id="song-length-error-edit" className="typo-sm-r text-destructive">
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
          onClick={onCancel}
          disabled={isPending || isUploading}
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
          {isPending || isUploading ? '저장 중...' : '저장'}
        </Button>
      </div>

      <SongSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelect={handleSelectTrack}
        onManualEntry={handleManualEntry}
      />

      <ImageCropDialog
        {...cropDialogProps}
        aspect={CROP_ASPECT.square}
        title="합주곡 커버 자르기"
        onCropped={applyCroppedCover}
      />
    </>
  );
};
