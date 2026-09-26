/**
 * Compile-time check that every tenants/<name>/content.json matches the TenantContent schema.
 * Nothing imports this file; `tsc` (pnpm typecheck) is what runs it.
 *
 * JSON imports widen string literals ("rtl" → string), so the shape is checked with literals widened.
 * The literal values (dir, tone, format) are checked at load time in ../tenants.ts.
 */
import type { TenantContent } from './content-types';
import vela from '../../../../tenants/vela/content.json';
import harbor from '../../../../tenants/harbor/content.json';
import qamar from '../../../../tenants/qamar/content.json';

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

export const tenantContentShapes = [vela, harbor, qamar] satisfies Widen<TenantContent>[];
