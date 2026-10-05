import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import { queryClient } from './query-client';
import { router } from './router';

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster position="top-right" richColors closeButton />
  </QueryClientProvider>
);
