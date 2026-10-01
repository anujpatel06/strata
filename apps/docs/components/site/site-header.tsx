import { IconBrandGithub } from '@tabler/icons-react';
import Link from 'next/link';
import { DOC_GROUPS, DOC_PAGES } from '@/lib/docs';
import { CATEGORY_LABEL } from '@/lib/meta-types';
import { getAllMeta } from '@/lib/meta';
import { getSidebar } from '@/lib/nav';
import { GITHUB_URL } from '@/lib/site';
import { LogoMark } from './logo';
import { MainNav } from './main-nav';
import { MobileNav } from './mobile-nav';
import { Search, type SearchGroup } from './search';
import { SchemeToggle } from './scheme-toggle';
import styles from './site-header.module.css';

function searchGroups(): SearchGroup[] {
  const groups: SearchGroup[] = DOC_GROUPS.map((g) => ({
    label: g.label,
    items: DOC_PAGES.filter((p) => p.group === g.id).map((p) => ({
      href: p.href,
      title: p.title,
      keywords: `${p.description} ${p.keywords ?? ''}`,
      description: p.description,
    })),
  }));
  groups.push({
    label: 'Components',
    items: [
      {
        href: '/docs/components',
        title: 'All components',
        keywords: 'index overview list',
        description: 'Every component, grouped by what it does.',
      },
      ...getAllMeta().map((m) => ({
        href: `/docs/components/${m.name}`,
        title: m.title,
        keywords: `${m.name} ${CATEGORY_LABEL[m.category]} ${m.description} ${m.exports.join(' ')}`,
        description: m.description,
        meta: CATEGORY_LABEL[m.category],
      })),
    ],
  });
  groups.push({
    label: 'Pages',
    items: [
      { href: '/', title: 'Home', keywords: 'start landing', description: 'Syntara at a glance, live in every tenant.' },
      { href: '/blocks', title: 'Blocks', keywords: 'patterns screens', description: 'Whole screens built only from Syntara components.' },
      { href: '/themes', title: 'Themes', keywords: 'tenants brands generator', description: 'Type a brand colour, get an accessible theme.' },
      { href: '/colors', title: 'Colors', keywords: 'palette ramps roles', description: 'Every brand’s ramps, light and dark. Click to copy.' },
      { href: '/story', title: 'Story', keywords: 'case study decisions evidence rollout numbers', description: 'How it was built, the numbers, and what they do not cover.' },
    ],
  });
  return groups;
}

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <MobileNav groups={getSidebar()} />
        <Link href="/" className={styles.brand} aria-label="Syntara home">
          <LogoMark size={20} />
          <span className={styles.brandName} aria-hidden="true">
            Syntara
          </span>
        </Link>
        <MainNav />
        <div className={styles.actions}>
          <Search groups={searchGroups()} />
          <a href={GITHUB_URL} className={styles.iconLink} aria-label="Syntara on GitHub" target="_blank" rel="noreferrer">
            <IconBrandGithub aria-hidden />
          </a>
          <SchemeToggle />
        </div>
      </div>
    </header>
  );
}
