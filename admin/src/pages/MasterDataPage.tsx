import { useState } from 'react';

import { MasterDataTable } from '@/features/master-data/components/MasterDataTable';
import type { MasterDataKind } from '@/features/master-data/types';
import { Card } from '@/shared/ui/Card';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Tabs } from '@/shared/ui/Tabs';

const KIND_TABS: ReadonlyArray<{ value: MasterDataKind; label: string }> = [
  { value: 'genres', label: '장르' },
  { value: 'skill-types', label: '세션' },
];

export const MasterDataPage = () => {
  const [kind, setKind] = useState<MasterDataKind>('genres');

  return (
    <div>
      <PageHeader
        title="마스터 데이터"
        description="정렬 순서 오름차순, 이름순으로 표시됩니다. 사용 중인 항목은 연결된 데이터가 함께 지워지므로 삭제할 수 없습니다."
      />
      <Card bodyClassName="p-0">
        <div className="px-4 pt-3">
          <Tabs tabs={KIND_TABS} value={kind} onChange={setKind} />
        </div>
        <MasterDataTable key={kind} kind={kind} />
      </Card>
    </div>
  );
};
