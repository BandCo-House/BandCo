import { FunnelCard } from '@/features/dashboard/components/FunnelCard';
import { SignupsChart } from '@/features/dashboard/components/SignupsChart';
import { StorageCard } from '@/features/dashboard/components/StorageCard';
import { SummaryCards } from '@/features/dashboard/components/SummaryCards';
import { PageHeader } from '@/shared/ui/PageHeader';

export const DashboardPage = () => (
  <div>
    <PageHeader title="대시보드" description="모든 날짜는 KST 기준입니다." />
    <div className="space-y-6">
      <SummaryCards />
      <div className="grid gap-6 xl:grid-cols-2">
        <SignupsChart />
        <FunnelCard />
      </div>
      <StorageCard />
    </div>
  </div>
);
