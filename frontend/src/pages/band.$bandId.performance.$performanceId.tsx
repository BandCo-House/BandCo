import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/band/$bandId/performance/$performanceId')({
  component: Outlet,
});
