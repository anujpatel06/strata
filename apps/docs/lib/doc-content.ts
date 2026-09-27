/** Server-only: MDX loaders for the pages listed in lib/docs.ts (explicit imports keep bundling static). */
import type { ComponentType } from 'react';

type MdxModule = { default: ComponentType };

export const DOC_CONTENT: Record<string, () => Promise<MdxModule>> = {
  index: () => import('../content/docs/index.mdx'),
  installation: () => import('../content/docs/installation.mdx'),
  mcp: () => import('../content/docs/mcp.mdx'),
  figma: () => import('../content/docs/figma.mdx'),
  theming: () => import('../content/docs/theming.mdx'),
  color: () => import('../content/docs/color.mdx'),
  'dark-mode': () => import('../content/docs/dark-mode.mdx'),
  rtl: () => import('../content/docs/rtl.mdx'),
  density: () => import('../content/docs/density.mdx'),
  accessibility: () => import('../content/docs/accessibility.mdx'),
  governance: () => import('../content/docs/governance.mdx'),
  changelog: () => import('../content/docs/changelog.mdx'),
};
