/** Isomorphic re-export of the component metadata contract (packages/react/meta/schema.ts). */
export type { Category, ComponentMeta, Deprecation, ExampleDoc, PropDoc } from '../../../packages/react/meta/schema';
import type { Category } from '../../../packages/react/meta/schema';

/** Sidebar / index order and labels for meta.category. */
export const CATEGORY_ORDER: readonly Category[] = [
  'layout',
  'actions',
  'inputs',
  'overlays',
  'feedback',
  'display',
  'navigation',
  'data',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  layout: 'Layout',
  actions: 'Actions',
  inputs: 'Inputs',
  overlays: 'Overlays',
  feedback: 'Feedback',
  display: 'Display',
  navigation: 'Navigation',
  data: 'Data',
};

/** Compact summary passed to client components (sidebar, search, index cards). */
export interface ComponentSummary {
  name: string;
  title: string;
  description: string;
  category: Category;
  maturity: 'alpha' | 'beta' | 'stable';
  /** The example the component page opens with, and the one the index card draws as a still. */
  example: string;
  /** `meta.opens`: the caption for that still, on the components whose example shows only a trigger. */
  opens?: string;
}
