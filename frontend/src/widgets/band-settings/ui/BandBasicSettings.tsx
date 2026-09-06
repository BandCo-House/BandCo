import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import WithdrawIcon from '@/assets/icons/withdraw.svg?react';
import { uploadFile } from '@/shared/api';
import { useLeaveBand } from '@/entities/band/api/useLeaveBand';
import { useUpdateBand } from '@/entities/band/api/useUpdateBand';
import type { BandDetail } from '@/entities/band/model/types';
import { buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import {
  SegmentedToggle,
  type SegmentedOption,
} from '@/shared/ui/segmented-toggle';
import { ThumbnailRemoveButton } from '@/shared/ui/thumbnail-remove-button';
import { setBandSettingsSaveAction } from '../model/save-action-store';
import { BandInviteLinkCard } from './BandInviteLinkCard';

interface BandBasicSettingsProps {
  band: BandDetail;
}

const COVER_FOLDER = 'band-covers';

type Visibility = 'private' | 'public';

// 공개는 강조(primary), 비공개는 중립 회색으로 채워 상태 의미를 색으로도 구분한다.
const VISIBILITY_OPTIONS: SegmentedOption<Visibility>[] = [
  {
    value: 'private',
    label: '비공개',
    selectedClassName: 'bg-grey-300 text-gradient-top',
  },
  { value: 'public', label: '공개' },
];

/**
 * 밴드 설정 - 기본 설정 탭. 이름·커버·공개 여부를 고치고 헤더의 `저장`으로 한 번에 반영한다.
 * 저장 가능 여부(변경 있음 + 이름 비어있지 않음)는 save-action-store로 헤더 버튼에 넘긴다.
 */
export const BandBasicSettings = ({ band }: BandBasicSettingsProps) => {
  const navigate = useNavigate();
  const { mutate: update, isPending: isSaving } = useUpdateBand(band.id);
  const { mutate: leave, isPending: isLeaving } = useLeaveBand(band.id);

  const [name, setName] = useState(band.name);
  const [visibility, setVisibility] = useState<Visibility>(
    band.visibility ? 'public' : 'private',
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  // 저장된 커버를 지우겠다는 의사. 새 파일을 고르면 자동으로 해제된다.
  const [isCoverCleared, setIsCoverCleared] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  // 미리보기 blob URL은 값이 바뀌거나 언마운트될 때 revoke한다.
  useEffect(() => {
    if (!coverPreview) return;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const trimmedName = name.trim();
  const isDirty =
    trimmedName !== band.name ||
    (visibility === 'public') !== band.visibility ||
    coverFile !== null ||
    isCoverCleared;
  const canSave = isDirty && trimmedName.length > 0 && !isUploading;

  const handleSubmit = async () => {
    if (!canSave) return;

    let coverImgUrl: string | undefined;
    if (coverFile) {
      setIsUploading(true);
      try {
        coverImgUrl = await uploadFile(coverFile, COVER_FOLDER);
      } catch {
        toast.error('커버 이미지를 업로드하지 못했어요.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    update(
      {
        name: trimmedName,
        visibility: visibility === 'public',
        // 새로 올렸으면 그 URL, 지웠으면 null, 둘 다 아니면 건드리지 않는다.
        ...(coverImgUrl
          ? { coverImgUrl }
          : isCoverCleared
            ? { coverImgUrl: null }
            : {}),
      },
      {
        onSuccess: () => {
          setCoverFile(null);
          setCoverPreview(null);
          setIsCoverCleared(false);
          toast.success('밴드 설정을 저장했어요.');
        },
        onError: () => {
          toast.error('밴드 설정을 저장하지 못했어요.');
        },
      },
    );
  };

  // 헤더 저장 버튼이 최신 핸들러를 부를 수 있게 ref로 넘긴다(등록은 상태가 바뀔 때만).
  const submitRef = useRef(handleSubmit);
  useEffect(() => {
    submitRef.current = handleSubmit;
  });
  useEffect(() => {
    setBandSettingsSaveAction({
      canSave,
      isSaving: isSaving || isUploading,
      save: () => void submitRef.current(),
    });
    return () => setBandSettingsSaveAction(null);
  }, [canSave, isSaving, isUploading]);

  const handleCoverSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
      setIsCoverCleared(false);
    }
    event.target.value = '';
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    // 저장된 커버가 있으면 지우겠다는 표시를 남겨야 저장 때 null로 보낼 수 있다.
    setIsCoverCleared(Boolean(band.coverImgUrl));
  };

  const coverUrl = coverPreview ?? (isCoverCleared ? null : band.coverImgUrl);

  const handleLeave = () => {
    leave(undefined, {
      onSuccess: () => {
        toast.success('밴드에서 나왔어요.');
        setIsLeaveOpen(false);
        // 더 이상 볼 수 없는 밴드라 설정 화면에 남겨두면 안 된다.
        void navigate({ to: '/my-bands' });
      },
      onError: () => {
        toast.error(
          '밴드를 나가지 못했어요. 밴드 마스터는 밴드를 나갈 수 없어요.',
        );
        setIsLeaveOpen(false);
      },
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Field label="밴드 이름" htmlFor="band-name">
        <Input
          id="band-name"
          variant="underline"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="밴드 이름을 입력해주세요"
          maxLength={40}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <FieldLabel>밴드 커버</FieldLabel>
        {coverUrl ? (
          <div className="flex items-start gap-3">
            <div className="relative w-20">
              <img
                src={coverUrl}
                alt="밴드 커버 미리보기"
                className="size-20 rounded-md object-cover"
              />
              <ThumbnailRemoveButton
                label="밴드 커버 제거"
                onClick={clearCover}
              />
            </div>
            {/* 커버가 있어도 바로 다른 이미지로 바꿀 수 있어야 한다. */}
            <label
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'cursor-pointer focus-within:outline-2 focus-within:outline-primary',
              )}
            >
              이미지 수정
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="sr-only"
              />
            </label>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 rounded-full field-border border-surface-1 bg-grey-500/24 px-5 py-4 text-grey-300 focus-within:outline-2 focus-within:outline-primary">
            <Upload aria-hidden="true" className="size-6" />
            <span className="typo-base-sb">파일을 선택하세요</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <Field label="밴드 공개 여부">
        <SegmentedToggle
          variant="tab"
          label="밴드 공개 여부"
          options={VISIBILITY_OPTIONS}
          value={visibility}
          onChange={setVisibility}
          className="w-fit"
        />
      </Field>

      <div aria-hidden className="h-px w-full bg-grey-50/10" />

      <section className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <FieldLabel>밴드 초대 링크</FieldLabel>
          <button
            type="button"
            // TODO: 초대 내역 화면 미구현 + 프론트(/invites)와 백엔드(/invitations) 경로 불일치.
            onClick={() => toast('초대 내역 화면은 준비 중이에요.')}
            className="typo-sm-b text-grey-200 focus-visible:outline-2 focus-visible:outline-primary"
          >
            초대 내역 보기
          </button>
        </div>
        <BandInviteLinkCard bandId={band.id} bandName={band.name} />
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsLeaveOpen(true)}
          disabled={isLeaving}
          className="flex items-center gap-2 rounded-full px-4 py-5 typo-xs-sb text-destructive focus-visible:outline-2 focus-visible:outline-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          <WithdrawIcon aria-hidden="true" className="size-4" />
          밴드 나가기
        </button>
      </div>

      <ConfirmDialog
        open={isLeaveOpen}
        onOpenChange={setIsLeaveOpen}
        title="밴드를 나갈까요?"
        description="나가면 이 밴드의 일정과 라이브러리를 볼 수 없어요. 다시 참여하려면 초대가 필요합니다."
        confirmLabel="나가기"
        onConfirm={handleLeave}
      />
    </div>
  );
};
