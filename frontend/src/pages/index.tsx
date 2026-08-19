import { createFileRoute } from '@tanstack/react-router';
import { Logo } from '@/shared/ui/logo';
import { HomeMain } from '@/widgets/home/ui/HomeMain';
import { HomeHeaderActions } from '@/widgets/home/ui/HomeHeaderActions';

export const Route = createFileRoute('/')({
  component: HomeRoutePage,
  staticData: {
    header: {
      title: () => (
        <h1>
          <Logo />
        </h1>
      ),
      showBack: false,
      bottomBlur: true,
      renderRight: () => <HomeHeaderActions />,
    },
  },
});

function HomeRoutePage() {
  return <HomeMain />;
}
