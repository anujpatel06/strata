# ADR-019: Mobile story is a server-driven UI schema plus native tokens, not native components

- **Status:** Accepted — decided by **Claude recommended, Anuj accepted**
- **Date:** 2026-09-27
- **Principles:** 1, 2, 6

## Context

- Anuj is also targeting app-first Indian consumer companies (Flipkart, Meesho, Swiggy and similar). Strata is web-only; ADR-001 and ADR-003 both name a second platform as a revisit trigger.
- Research (`docs/research/2026-09-27-differentiation.md`, §5): Flipkart, Swiggy, PhonePe and Zomato have published about server-driven UI, where the backend sends the layout and the app renders it. Several of those sources are old or second-hand.
- Porting 46 components to SwiftUI and Compose is months of work. Thin ports would break the craft bar.
- Claude first recommended a native Compose slice, then changed the recommendation after the research.

## Decision

- **Schema:** generate a JSON Schema per component from `meta.json` (ADR-007 stays the single source). A screen is a JSON document checked against it.
- **Rules that ship with the schema:** versioning, what a client does with an unknown component or prop, and which props are allowed over the wire. Accessible names are required fields.
- **Renderer demo:** one web renderer in the docs that draws a screen from JSON with Strata components, across tenants. No native renderer.
- **Native tokens:** Compose and SwiftUI colour, space, radius and type files per tenant, light and dark, built downstream of the engine's DTCG output. Contrast is re-checked on the converted sRGB values, not assumed.
- **Native components are out of scope.** The docs say so plainly.
- This work is a new phase after Phase 5 (BRIEF §13).

## Alternatives considered

- **SwiftUI + Compose component libraries:** the strongest signal if done well, but two more codebases and two more accessibility models. Too large for one person at this bar.
- **React Native package:** one codebase, but CSS Modules don't carry over and native teams find it less convincing.
- **Native slice of 6–8 components:** reasonable, and still possible later. It costs more than the schema and matches how these companies ship less closely.

## Consequences

- **Good:** extends `meta.json` instead of adding a second source. Matches a published practice at the target companies. Small enough to finish properly.
- **Bad:** Strata still can't claim native components or "cross-platform". The schema is a contract and a demo, not a production SDUI framework. Which native token exporter to use (own code or Style Dictionary, per ADR-001) is still open.
- **Revisit when:** a target role asks for native component code, or the token export shows that tokens alone don't prove enough.
