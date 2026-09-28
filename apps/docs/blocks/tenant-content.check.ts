/**
 * Compile-time check that every tenant's content.json feeds every block: the docs pass each tenant's JSON straight
 * to the blocks as `content`, so it must match their content types. Nothing imports this file; `tsc` (the docs
 * typecheck, and `next build`) is what runs it. The generator's content-types.ts checks the same files against
 * the same shapes from its side.
 */
import care from '../../../tenants/care/content.json';
import haat from '../../../tenants/haat/content.json';
import harbor from '../../../tenants/harbor/content.json';
import qamar from '../../../tenants/qamar/content.json';
import vela from '../../../tenants/vela/content.json';
import type { ActivityTableContent } from './activity-table/activity-table.content';
import { benefitsOverviewTenantCopy, type BenefitsOverviewContent } from './benefits-overview/benefits-overview.content';
import type { DashboardOverviewContent } from './dashboard-overview/dashboard-overview.content';
import type { RequestFlowContent } from './request-flow/request-flow.content';
import type { SettingsContent } from './settings/settings.content';
import type { SignInContent } from './sign-in/sign-in.content';

/** JSON imports widen literals ("danger" → string), so compare against the widened block types. */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

/**
 * benefits-overview's own copy (`benefitsOverview`) ships with the block as per-tenant sample copy, so content.json only
 * has to supply the shared keys; a tenant may still add `benefitsOverview` to its content.json to override it.
 */
type AllBlocks = DashboardOverviewContent &
  RequestFlowContent &
  SettingsContent &
  SignInContent &
  ActivityTableContent &
  Omit<BenefitsOverviewContent, 'benefitsOverview'> &
  Partial<Pick<BenefitsOverviewContent, 'benefitsOverview'>>;

export const tenantBlockContent = [vela, harbor, qamar, care, haat] satisfies Widen<AllBlocks>[];

/** Every tenant the docs render has benefits-overview copy, and the tenant's JSON plus that copy is a full content object. */
export const benefitsOverviewTenants = (
  [
    ['vela', vela],
    ['harbor', harbor],
    ['qamar', qamar],
    ['care', care],
    ['haat', haat],
  ] as const
).map(([id, json]) => ({ ...json, ...benefitsOverviewTenantCopy[id]! }) satisfies Widen<BenefitsOverviewContent>);
