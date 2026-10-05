import { useState, type FormEvent } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import { useUsers } from '@/features/users/api';
import { UserStateBadge } from '@/features/users/components/UserStateBadge';
import {
  USER_STATUS_FILTER_LABELS,
  USER_STATUS_FILTERS,
  getLoginMethodLabels,
} from '@/features/users/labels';
import type { UserStatusFilter } from '@/features/users/types';
import { formatDateTime, formatNumber, orDash } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { Input } from '@/shared/ui/Input';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Pagination } from '@/shared/ui/Pagination';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';
import { Tabs } from '@/shared/ui/Tabs';

const routeApi = getRouteApi('/_auth/users');

const ALL_FILTER = 'ALL';
type StatusTab = UserStatusFilter | typeof ALL_FILTER;

const STATUS_TABS: ReadonlyArray<{ value: StatusTab; label: string }> = [
  { value: ALL_FILTER, label: '전체' },
  ...USER_STATUS_FILTERS.map((status) => ({
    value: status,
    label: USER_STATUS_FILTER_LABELS[status],
  })),
];

export const UsersPage = () => {
  const search = routeApi.useSearch();
  const navigate = useNavigate({ from: '/users' });
  const [keyword, setKeyword] = useState(search.keyword ?? '');
  const { data, isPending, isError } = useUsers({
    keyword: search.keyword,
    status: search.status,
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

  const handleStatusChange = (value: StatusTab) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        status: value === ALL_FILTER ? undefined : value,
        page: undefined,
      }),
    });
  };

  const renderTable = () => {
    if (isPending) {
      return <LoadingState />;
    }
    if (isError) {
      return <EmptyState title="회원 목록을 불러오지 못했습니다." />;
    }
    if (data.items.length === 0) {
      return <EmptyState title="조건에 맞는 회원이 없습니다." />;
    }

    return (
      <>
        <Table>
          <THead>
            <tr>
              <Th>닉네임</Th>
              <Th>이메일</Th>
              <Th>상태</Th>
              <Th>가입 수단</Th>
              <Th className="text-right">밴드</Th>
              <Th>가입일</Th>
              <Th>최근 로그인</Th>
            </tr>
          </THead>
          <TBody>
            {data.items.map((user) => (
              <Tr
                key={user.userId}
                clickable
                onClick={() =>
                  void navigate({
                    to: '/users/$userId',
                    params: { userId: user.userId },
                  })
                }
              >
                <Td className="font-medium text-slate-900">
                  {orDash(user.nickname)}
                </Td>
                <Td>{orDash(user.email)}</Td>
                <Td>
                  <UserStateBadge {...user} />
                </Td>
                <Td>
                  {getLoginMethodLabels(user.providers, user.hasPassword).join(
                    ', ',
                  ) || '-'}
                </Td>
                <Td className="text-right">{formatNumber(user.bandCount)}</Td>
                <Td>{formatDateTime(user.createdAt)}</Td>
                <Td>{formatDateTime(user.lastLoginAt)}</Td>
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
      <PageHeader
        title="회원"
        description="서비스 회원을 조회하고 관리합니다."
      />
      <Card bodyClassName="p-0">
        <div className="space-y-3 p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이메일, 닉네임 또는 회원 ID"
              aria-label="회원 검색어"
              className="max-w-md"
            />
            <Button type="submit" variant="secondary">
              <Search className="size-4" aria-hidden />
              검색
            </Button>
          </form>
          <Tabs
            tabs={STATUS_TABS}
            value={search.status ?? ALL_FILTER}
            onChange={handleStatusChange}
          />
        </div>
        {renderTable()}
      </Card>
    </div>
  );
};
