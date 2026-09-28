/**
 * @syntara/sdui — Syntara's server-driven UI contract: a JSON Schema per component (generated from meta.json), a strict
 * validator for producers, and the tolerant preparation a client runs before drawing. No React import in this entry;
 * the reference web renderer is `@syntara/sdui/react`.
 */
export { SCHEMA_VERSION, SUPPORTED_MAJOR, HREF_PATTERN, IMAGE_URL_PATTERN, MAX_DEPTH, directionOf, parseVersion } from './contract';
export { validateScreen, createAjv, SYNTARA_KEYWORDS, type ValidationError, type ValidationResult } from './validate';
export {
  prepareScreen,
  type Action,
  type Issue,
  type IssueCode,
  type Prepared,
  type PreparedNode,
  type ScreenDocument,
} from './prepare';
export { manifest } from './manifest';
export type { Manifest, ManifestNode, ManifestProp } from './manifest-types';
