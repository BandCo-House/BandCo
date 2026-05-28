import { RouterProvider } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useAuth } from '@/app/providers/auth-context';
import { Providers } from '@/app/providers';
import { createAppRouter } from '@/app/router';
import { Toaster } from '@/shared/ui/sonner';

const router = createAppRouter();
const shouldShowRouterDevtools = import.meta.env.MODE === 'development';

function AppContent() {
  const auth = useAuth();

  return (
    <>
      <RouterProvider router={router} context={{ user: auth.user, logout: auth.logout }} />
      <Toaster position="bottom-center" closeButton />
      {shouldShowRouterDevtools ? (
        <TanStackRouterDevtools router={router} />
      ) : null}
    </>
  );
}

function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}

export default App;
