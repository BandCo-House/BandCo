import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Input } from '@/shared/ui/Input';
import { ConfirmModal } from '@/shared/ui/Modal';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import {
  MASTER_DATA_NAME_MAX_LENGTH,
  useCreateMasterData,
  useDeleteMasterData,
  useMasterData,
  useUpdateMasterData,
} from '../api';
import type {
  CreateMasterDataRequest,
  MasterDataItem,
  MasterDataKind,
} from '../types';

// 받침 유무에 따라 조사가 달라 문구별로 둔다.
const KIND_LABELS: Record<
  MasterDataKind,
  { label: string; object: string; subject: string; topic: string }
> = {
  genres: {
    label: '장르',
    object: '장르를',
    subject: '장르가',
    topic: '장르는',
  },
  'skill-types': {
    label: '세션',
    object: '세션을',
    subject: '세션이',
    topic: '세션은',
  },
};

interface DraftRow {
  name: string;
  sortOrder: string;
}

const EMPTY_DRAFT: DraftRow = { name: '', sortOrder: '' };

/** 빈 정렬 순서는 보내지 않는다(서버 기본값 사용). */
const parseSortOrder = (value: string): number | undefined => {
  if (value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

const toRequest = (draft: DraftRow): CreateMasterDataRequest => ({
  name: draft.name.trim(),
  sortOrder: parseSortOrder(draft.sortOrder),
});

export const MasterDataTable = ({ kind }: { kind: MasterDataKind }) => {
  const { label, object, subject, topic } = KIND_LABELS[kind];
  const { data, isPending, isError } = useMasterData(kind);
  const createItem = useCreateMasterData(kind);
  const updateItem = useUpdateMasterData(kind);
  const deleteItem = useDeleteMasterData(kind);

  const [newDraft, setNewDraft] = useState<DraftRow>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<DraftRow>(EMPTY_DRAFT);
  const [deleteTarget, setDeleteTarget] = useState<MasterDataItem | null>(null);

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    createItem.mutate(toRequest(newDraft), {
      onSuccess: () => {
        toast.success(`${object} 추가했습니다.`);
        setNewDraft(EMPTY_DRAFT);
      },
    });
  };

  const startEdit = (item: MasterDataItem) => {
    setEditingId(item.id);
    setEditDraft({ name: item.name, sortOrder: String(item.sortOrder) });
  };

  const handleUpdate = (id: string) => {
    updateItem.mutate(
      { id, body: toRequest(editDraft) },
      {
        onSuccess: () => {
          toast.success(`${object} 수정했습니다.`);
          setEditingId(null);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }
    deleteItem.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${object} 삭제했습니다.`);
        setDeleteTarget(null);
      },
    });
  };

  const renderRows = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title={`${label} 목록을 불러오지 못했습니다.`} />;
    }
    if (data.length === 0) {
      return <EmptyState title={`등록된 ${subject} 없습니다.`} />;
    }

    return (
      <Table>
        <THead>
          <tr>
            <Th>이름</Th>
            <Th className="w-32">정렬 순서</Th>
            <Th className="w-28 text-right">사용 수</Th>
            <Th className="w-44" />
          </tr>
        </THead>
        <TBody>
          {data.map((item) => {
            const isEditing = editingId === item.id;
            const inUse = item.usageCount > 0;

            return (
              <Tr key={item.id}>
                <Td>
                  {isEditing ? (
                    <Input
                      value={editDraft.name}
                      maxLength={MASTER_DATA_NAME_MAX_LENGTH}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      aria-label="이름"
                    />
                  ) : (
                    <span className="font-medium text-slate-900">
                      {item.name}
                    </span>
                  )}
                </Td>
                <Td>
                  {isEditing ? (
                    <Input
                      type="number"
                      step={1}
                      value={editDraft.sortOrder}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          sortOrder: event.target.value,
                        }))
                      }
                      aria-label="정렬 순서"
                    />
                  ) : (
                    item.sortOrder
                  )}
                </Td>
                <Td className="text-right">{formatNumber(item.usageCount)}</Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          disabled={!editDraft.name.trim()}
                          loading={updateItem.isPending}
                          onClick={() => handleUpdate(item.id)}
                        >
                          저장
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          수정
                        </Button>
                        {/* 비활성 버튼은 마우스 이벤트가 없어 툴팁을 감싼 span에 둔다. */}
                        <span
                          title={
                            inUse
                              ? `사용 중인 ${topic} 삭제할 수 없습니다. (${formatNumber(item.usageCount)}건 사용)`
                              : undefined
                          }
                        >
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={inUse}
                            onClick={() => setDeleteTarget(item)}
                          >
                            삭제
                          </Button>
                        </span>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TBody>
      </Table>
    );
  };

  return (
    <div>
      <form
        onSubmit={handleCreate}
        className="flex items-end gap-2 border-b border-slate-100 p-4"
      >
        <Input
          value={newDraft.name}
          maxLength={MASTER_DATA_NAME_MAX_LENGTH}
          onChange={(event) =>
            setNewDraft((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder={`새 ${label} 이름 (최대 ${MASTER_DATA_NAME_MAX_LENGTH}자)`}
          aria-label={`새 ${label} 이름`}
          className="max-w-xs"
        />
        <Input
          type="number"
          step={1}
          value={newDraft.sortOrder}
          onChange={(event) =>
            setNewDraft((prev) => ({ ...prev, sortOrder: event.target.value }))
          }
          placeholder="정렬 순서 (선택)"
          aria-label="새 항목 정렬 순서"
          className="w-40"
        />
        <Button
          type="submit"
          disabled={!newDraft.name.trim()}
          loading={createItem.isPending}
        >
          추가
        </Button>
      </form>
      {renderRows()}

      <ConfirmModal
        open={deleteTarget !== null}
        title={`${label} 삭제`}
        description={
          deleteTarget ? `"${deleteTarget.name}"을(를) 삭제합니다.` : undefined
        }
        confirmLabel="삭제"
        danger
        loading={deleteItem.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
