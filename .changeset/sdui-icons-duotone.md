---
"@syntara/sdui": minor
---

The wire knows the duotone icons; schema version 1.0.0 → 1.1.0.

- `icons` gains the 237 `<name>-duotone` values, so a server-driven screen can ask for a duotone icon. Additive: every screen written against 1.0.0 still validates, and the evolution guard in `scripts/build-schemas.ts` is what classified this as a minor bump.
- `src/validator.generated.js` is regenerated with the schema. Since ADR-034 the validator is compiled at build time, so adding names to the enum alone would ship a schema that accepts a duotone icon and a validator that rejects it.
- A renderer pinned to 1.0.0 will reject a screen that names a duotone icon. `SUPPORTED_MAJOR` is unchanged, so nothing else has to move.
