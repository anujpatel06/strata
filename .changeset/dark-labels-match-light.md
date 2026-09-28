---
"@syntara/theme-engine": minor
---

Dark mode keeps the light-mode label on solid fills (primary, accent, feedback). When the light label fails in dark, the dark fill moves by up to ΔL 0.12 (deeper for white, lighter for ink), logged as a `choice` adjustment. Pure red now gets `#ec0000` with white labels in both schemes. `resolveRoles` takes an optional third argument, the light-mode roles. (ADR-006)
