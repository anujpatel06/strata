---
"@syntara/tokens": patch
---

`@syntara/theme-engine` is now a dev dependency. The package ships built files only and never needed the engine at run time, so installing it no longer tries to fetch the engine.
