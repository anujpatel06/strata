/** Server-only: sidebar structure and page order (docs pages, then components by category). */
import { cache } from 'react';
import { DOC_GROUPS, DOC_PAGES } from './docs';
import { getComponentGroups } from './meta';

export interface NavItem {
  href: string;
  title: string;
  /** Small trailing label, e.g. a maturity. */
  badge?: string;
}

export interface NavSection {
  /** Optional sub-heading inside a group (component categories). */
  label?: string;
  items: NavItem[];
}

export interface NavGroup {
  label: string;
  sections: NavSection[];
}

export const getSidebar = cache((): NavGroup[] => {
  const groups: NavGroup[] = DOC_GROUPS.map((g) => ({
    label: g.label,
    sections: [{ items: DOC_PAGES.filter((p) => p.group === g.id).map((p) => ({ href: p.href, title: p.title })) }],
  }));
  groups.push({
    label: 'Components',
    sections: [
      { items: [{ href: '/docs/components', title: 'All components' }] },
      ...getComponentGroups().map((c) => ({
        label: c.label,
        items: c.items.map((m) => ({
          href: `/docs/components/${m.name}`,
          title: m.title,
          badge: m.maturity === 'alpha' ? 'alpha' : undefined,
        })),
      })),
    ],
  });
  return groups;
});

/** Every sidebar page in reading order, for prev/next links. */
export const getPageOrder = cache((): NavItem[] =>
  getSidebar().flatMap((g) => g.sections.flatMap((s) => s.items)),
);

export function getPrevNext(href: string): { prev?: NavItem; next?: NavItem } {
  const order = getPageOrder();
  const i = order.findIndex((p) => p.href === href);
  if (i === -1) return {};
  return { prev: order[i - 1], next: order[i + 1] };
}
