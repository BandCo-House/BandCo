import { useEffect, type ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * 앱 전역 테마 클래스를 제어한다.
 * 기본 테마는 dark이며 시스템 테마 동기화는 사용하지 않는다.
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';

    return () => {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.removeProperty('color-scheme');
    };
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
};
