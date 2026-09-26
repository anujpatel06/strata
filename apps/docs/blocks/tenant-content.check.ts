/**
 * Compile-time check that every tenant's content.json feeds every block: the docs pass each tenant's JSON straight
 * to the blocks as `content`, so it must match their content types. Nothing imports this file; `tsc` (the docs
 * typecheck, and `next build`) is what runs it. The generator's content-types.ts checks the same files against
 * the same shapes from its side.
 */
import harbor from '../../../tenants/harbor/content.json';
import qamar from '../../../tenants/qamar/content.json';
import vela from '../../../tenants/vela/content.json';
import type { ActivityTableContent } from './activity-table/activity-table.content';
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

type AllBlocks = DashboardOverviewContent & RequestFlowContent & SettingsContent & SignInContent & ActivityTableContent;

export const tenantBlockContent = [vela, harbor, qamar] satisfies Widen<AllBlocks>[];
