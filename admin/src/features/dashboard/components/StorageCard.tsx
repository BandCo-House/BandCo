import { Link } from '@tanstack/react-router';
import { HardDrive } from 'lucide-react';

import { formatBytes, formatDateTime, formatNumber } from '@/shared/lib/format';
import { Button } from '@/shared/ui/Button';
import { Card, InfoList } from '@/shared/ui/Card';
import { EmptyState, LoadingState } from '@/shared/ui/EmptyState';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import { useStorageScan } from '../api';

export const StorageCard = () => {
  const { data, isFetching, refetch } = useStorageScan();

  const renderBody = () => {
    if (isFetching) {
      return (
        <LoadingState label="버킷을 스캔하는 중… 시간이 걸릴 수 있습니다." />
      );
    }
    if (!data) {
      return (
        <EmptyState
          title="아직 스캔하지 않았습니다."
          description="S3 버킷 전체를 훑기 때문에 필요할 때만 실행하세요."
        />
      );
    }

    return (
      <div className="space-y-5">
        <InfoList
          columns={3}
          items={[
            { label: '전체 용량', value: formatBytes(data.totalBytes) },
            { label: '객체 수', value: formatNumber(data.objectCount) },
            { label: '유저 외 용량', value: formatBytes(data.otherBytes) },
          ]}
        />
        <div>
          <h3 className="mb-2 text-xs font-semibold text-slate-600">
            용량 상위 회원
          </h3>
          {data.topUsers.length === 0 ? (
            <EmptyState title="회원 파일이 없습니다." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>회원</Th>
                  <Th>이메일</Th>
                  <Th className="text-right">용량</Th>
                  <Th className="text-right">객체 수</Th>
                </tr>
              </THead>
              <TBody>
                {data.topUsers.map((user) => (
                  <Tr key={user.userId}>
                    <Td>
                      <Link
                        to="/users/$userId"
                        params={{ userId: user.userId }}
                        className="text-sky-700 hover:underline"
                      >
                        {user.nickname ?? user.userId}
                      </Link>
                    </Td>
                    <Td>{user.email ?? '-'}</Td>
                    <Td className="text-right">{formatBytes(user.bytes)}</Td>
                    <Td className="text-right">
                      {formatNumber(user.objectCount)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>
        <p className="text-right text-xs text-slate-400">
          스캔 시각 {formatDateTime(data.scannedAt)}
        </p>
      </div>
    );
  };

  return (
    <Card
      title="스토리지 사용량"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refetch()}
          loading={isFetching}
        >
          <HardDrive className="size-4" aria-hidden />
          스캔
        </Button>
      }
    >
      {renderBody()}
    </Card>
  );
};
