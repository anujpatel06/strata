import type { MDXComponents } from 'mdx/types';
import { Badge, Kbd } from '@strata/react';
import { Callout } from '@/components/mdx/callout';
import { CodeBlock } from '@/components/mdx/code-block';
import { PackageCommand } from '@/components/mdx/package-command';
import { Pre } from '@/components/mdx/pre';
import { A, Blockquote, H2, H3, H4, Hr, InlineCode, Li, Ol, P, Steps, Strong, Table, Ul } from '@/components/mdx/prose';
import { ComponentPreview } from '@/components/preview/component-preview';
import {
  AdrLink,
  AdrList,
  ContrastPairs,
  DensityTable,
  FuzzMargins,
  FuzzResults,
  HouseAdjustments,
  RegistryItems,
  RolesTable,
  ShadcnGaps,
  ShadcnMap,
  TenantGrid,
  TenantBrandJson,
} from '@/components/mdx/data';

/**
 * Global MDX mapping (required by @next/mdx in the App Router). Markdown elements get prose styles;
 * the rest are components MDX pages can use without importing.
 */
const components: MDXComponents = {
  h1: H2,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  a: A,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  hr: Hr,
  strong: Strong,
  code: InlineCode,
  pre: Pre,
  table: Table,
  // Components
  AdrLink,
  AdrList,
  Badge,
  Callout,
  CodeBlock,
  ComponentPreview,
  ContrastPairs,
  DensityTable,
  FuzzMargins,
  FuzzResults,
  HouseAdjustments,
  Kbd,
  PackageCommand,
  RegistryItems,
  RolesTable,
  ShadcnGaps,
  ShadcnMap,
  Steps,
  Table,
  TenantGrid,
  TenantBrandJson,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
