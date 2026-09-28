'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { I18nProvider, RouterProvider } from 'react-aria-components';

type PushOptions = NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: PushOptions;
  }
}

/**
 * React Aria links (Syntara Link, Breadcrumb, MenuItem href, CommandItem href) navigate with the Next router,
 * and the site renders in a fixed locale so server and client agree. Previews set their own locale.
 */
export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <RouterProvider navigate={(href, options) => router.push(href, options)}>
      <I18nProvider locale="en-US">{children}</I18nProvider>
    </RouterProvider>
  );
}
