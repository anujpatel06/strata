/** The generated manifest (schema/manifest.json), typed. */
import type { Manifest } from './manifest-types';
import { MANIFEST_JSON } from './schemas.generated';

export const manifest = MANIFEST_JSON as Manifest;
