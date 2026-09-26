import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { FontLoader } from '@/components/font-loader';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import skip from '@/components/site/skip-link.module.css';
import { SCHEME_SCRIPT } from '@/lib/scheme';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { getSiteTheme } from '@/lib/theme-css';
import './globals.css';
import layout from './layout.module.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — multi-brand design system`, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { title: SITE_NAME, description: SITE_DESCRIPTION, type: 'website' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const theme = getSiteTheme();
  return (
    <html lang="en" dir="ltr" data-strata-scheme="auto" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCHEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={theme.houseFontHref} />
        <style id="strata-themes" dangerouslySetInnerHTML={{ __html: theme.css }} />
      </head>
      <body>
        <a href="#main" className={skip.skip}>
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <div className={layout.page}>
            {children}
          </div>
          <SiteFooter />
        </Providers>
        <FontLoader hrefs={theme.tenantFontHrefs} />
      </body>
    </html>
  );
}
