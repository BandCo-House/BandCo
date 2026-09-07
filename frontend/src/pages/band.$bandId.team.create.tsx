import { createFileRoute, useParams } from '@tanstack/react-router';
import { BandTeamCreateView } from '@/features/team-create/ui/BandTeamCreateView';

export const Route = createFileRoute('/band/$bandId/team/create')({
  component: BandTeamCreateRoutePage,
  staticData: {
    header: {
      title: '팀 추가',
      titleSize: 'md',
      backTo: '/band/$bandId/settings',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
      getBackSearch: () => ({
        tab: 'teams',
      }),
    },
  },
});

function BandTeamCreateRoutePage() {
  const { bandId } = useParams({ from: '/band/$bandId/team/create' });
  return <BandTeamCreateView bandId={bandId} />;
}
