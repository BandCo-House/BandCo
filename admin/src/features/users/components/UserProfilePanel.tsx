import { Link } from '@tanstack/react-router';

import { formatDateTime, formatNumber, orDash } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/Badge';
import { Card, InfoList } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { TBody, THead, Table, Td, Th, Tr } from '@/shared/ui/Table';

import {
  BAND_MEMBER_ROLE_LABELS,
  BAND_MEMBER_ROLE_TONES,
  USER_STATUS_LABELS,
  getLoginMethodLabels,
} from '../labels';
import type { AdminUserDetail } from '../types';

export const UserProfilePanel = ({ user }: { user: AdminUserDetail }) => (
  <div className="space-y-6">
    <Card title="프로필">
      <InfoList
        items={[
          { label: '회원 ID', value: user.userId },
          { label: '이메일', value: orDash(user.email) },
          { label: '닉네임', value: orDash(user.nickname) },
          { label: '계정 상태', value: USER_STATUS_LABELS[user.status] },
          {
            label: '가입 수단',
            value:
              getLoginMethodLabels(user.providers, user.hasPassword).join(
                ', ',
              ) || '-',
          },
          { label: '비밀번호 설정', value: user.hasPassword ? '예' : '아니오' },
          { label: '가입일', value: formatDateTime(user.createdAt) },
          { label: '최근 로그인', value: formatDateTime(user.lastLoginAt) },
          { label: '탈퇴일', value: formatDateTime(user.deletedAt) },
          {
            label: '신고 (받음 / 함)',
            value: `${formatNumber(user.reportCounts.received)} / ${formatNumber(user.reportCounts.made)}`,
          },
          {
            label: '자기소개',
            value: (
              <span className="whitespace-pre-line">
                {orDash(user.selfDescription)}
              </span>
            ),
          },
        ]}
      />
    </Card>

    <Card title="연결된 소셜 계정" bodyClassName="p-0">
      {user.oauthAccounts.length === 0 ? (
        <EmptyState title="연결된 소셜 계정이 없습니다." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>제공자</Th>
              <Th>이메일</Th>
              <Th>연결일</Th>
            </tr>
          </THead>
          <TBody>
            {user.oauthAccounts.map((account) => (
              <Tr key={`${account.provider}-${account.createdAt}`}>
                <Td>{getLoginMethodLabels([account.provider], false)}</Td>
                <Td>{orDash(account.email)}</Td>
                <Td>{formatDateTime(account.createdAt)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>

    <Card title={`소속 밴드 (${user.bands.length})`} bodyClassName="p-0">
      {user.bands.length === 0 ? (
        <EmptyState title="소속된 밴드가 없습니다." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>밴드</Th>
              <Th>역할</Th>
              <Th>가입일</Th>
              <Th>상태</Th>
            </tr>
          </THead>
          <TBody>
            {user.bands.map((band) => (
              <Tr key={band.bandId}>
                <Td>
                  <Link
                    to="/bands/$bandId"
                    params={{ bandId: band.bandId }}
                    className="text-sky-700 hover:underline"
                  >
                    {band.name}
                  </Link>
                </Td>
                <Td>
                  <Badge tone={BAND_MEMBER_ROLE_TONES[band.role]}>
                    {BAND_MEMBER_ROLE_LABELS[band.role]}
                  </Badge>
                </Td>
                <Td>{formatDateTime(band.joinedAt)}</Td>
                <Td>{band.isDeleted && <Badge>삭제된 밴드</Badge>}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  </div>
);
