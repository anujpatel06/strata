---
name: screenshots
description: Take and review Syntara screenshots across tenants × schemes × RTL × widths after any UI change — docs pages, blocks, or playground components.
argument-hint: "[route or component name]"
---

Target: $ARGUMENTS (a docs route like `/docs/components/select`, a block like `request-flow`, or a component name for the playground).

1. Serve what you're checking:
   - docs: `cd apps/docs && npx next start -p 3000` after a build, or `pnpm docs` for dev. Use `localhost`, not 127.0.0.1.
   - playground: `pnpm --filter @syntara/playground dev --port 5199`, then `/?c=<name>&tenant=…&scheme=…&dir=…&density=…`.
   - blocks: `/blocks/<name>/view?tenant=<id>&scheme=<light|dark>`.
2. Shoot the matrix with `node scripts/shoot.mjs <url> <out.png> [--width=390] [--full] [--dark]`:
   - vela light
   - harbor dark
   - qamar light (RTL)
   - one compact-density shot
   - one 390px shot
   Save to `docs/screenshots/<phase>/` only if they're meant for the README; otherwise use a temp folder.
3. **Open and look at every image.** Check alignment and baselines, consistent control heights, rhythm, overflow at 390px, RTL mirroring (chevrons, placement, number direction), dark-mode contrast and focus rings.
4. Fix what's below shadcn grade, reshoot, and say what changed.

`pnpm screenshots` also runs the Phase 1 generator matrix with an axe report.
