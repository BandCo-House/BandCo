import { createRouter } from '@tanstack/react-router';
import type { RouterContext } from '@/app/router-guards';
import { routeTree } from '@/routeTree.gen';

export const createAppRouter = () => {
  return createRouter({
    routeTree,
    context: {} as RouterContext,
    defaultPendingMinMs: 150,
  });
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
