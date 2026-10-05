import { useState, type FormEvent } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import { useBands } from '@/features/bands/api';
import { getVisibilityLabel } from '@/features/bands/labels';
import { getUserDisplayName } from '@/features/users/labels';
import { formatDateTime, formatNumber } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Checkbox, Input } from '@/shared/ui/Input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

const routeApi = getRouteApi('/_auth/bands');

export const BandsPage = () => {
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: '/bands' });
  const [keyword, setKeyword] = useState(search.keyword ?? '');
  const { data, isPending, isError } = useBands({
    keyword: search.keyword,
    // false를 문자열로 보내면 백엔드에서 true로 해석될 수 있어 켰을 때만 보낸다.
    includeDeleted: search.includeDeleted,
    page: search.page ?? 1,
  });

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    void navigate({
      search: (prev) => ({
        ...prev,
        keyword: keyword.trim() || undefined,
        page: undefined,
      }),
    });
  };

  const handleIncludeDeletedChange = (checked: boolean) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        includeDeleted: checked ? true : undefined,
        page: undefined,
      }),
    });
  };

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="밴드 목록을 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="조건에 맞는 밴드가 없습니다." />;
    }

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th>밴드명</Th>
              <Th>공개</Th>
              <Th>밴드장</Th>
              <Th className="text-right">멤버</Th>
              <Th>생성일</Th>
              <Th>상태</Th>
            </tr>
          </THead>
          <TBody>
            {data.items.map((band) => (
              <Tr
                key={band.bandId}
                clickable
                onClick={() =>
                  void navigate({
                    to: '/bands/$bandId',
                    params: { bandId: band.bandId },
                  })
                }
              >
                <Td>
                  <div className="flex items-center gap-2">
                    {band.coverImgUrl ? (
                      <img
                        src={band.coverImgUrl}
                        alt=""
                        className="size-8 rounded object-cover"
                      />
                    ) : (
                      <div className="size-8 rounded bg-slate-100" />
                    )}
                    <span className="font-medium text-slate-900">
                      {band.name}
                    </span>
                  </div>
                </Td>
                <Td>{getVisibilityLabel(band.visibility)}</Td>
                <Td>{getUserDisplayName(band.bandMaster)}</Td>
                <Td className="text-right">{formatNumber(band.memberCount)}</Td>
                <Td>{formatDateTime(band.createdAt)}</Td>
                <Td>{band.deletedAt && <Badge tone="red">삭제됨</Badge>}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <Pagination
          pagination={data.pagination}
          onChange={(page) =>
            void navigate({ search: (prev) => ({ ...prev, page }) })
          }
        />
      </>
    );
  };

  return (
    <div>
      <PageHeader title="밴드" description="밴드를 조회하고 관리합니다." />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="밴드명 또는 밴드 ID"
              aria-label="밴드 검색어"
              className="max-w-md"
            />
            <Button type="submit" variant="secondary">
              <Search className="size-4" aria-hidden />
              검색
            </Button>
          </form>
          <Checkbox
            label="삭제된 밴드 포함"
            checked={search.includeDeleted === true}
            onChange={(event) =>
              handleIncludeDeletedChange(event.target.checked)
            }
          />
        </div>
        {renderTable()}
      </Card>
    </div>
  );
};
