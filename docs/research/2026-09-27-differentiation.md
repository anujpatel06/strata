# Research: how Strata differs from component libraries, theme generators and AI tooling

- **Date:** 2026-09-27
- **Asked by:** Anuj ("how do we differentiate from 21st.dev, shadcn/ui and similar?")
- **Method:** four web-research passes run by Claude subagents. Official docs, repos and changelogs were fetched where possible; the rest came from search summaries.
- **Feeds:** ADR-018, ADR-019, ADR-020.

## How to read this

- **[V]** read on a primary or official page · **[S]** search snippet or secondary source only · **[OLD]** source older than 2024 · **[U]** could not be verified.
- Most "not found" results are **absence of evidence**, not proof that nothing exists.
- **Re-check every claim before it goes on the site or into an interview.** This space moves monthly.
- No number here was produced by a Strata script. None of them may appear on the site as a Strata metric.

## 1. Where Strata stands

| Area | Status |
|---|---|
| Components | Commodity. Concede it. |
| Theme from a seed colour with guaranteed contrast | Material does this. Not new in kind. |
| MCP server for a design system | Table stakes (20 of 21 systems in a July 2026 survey). |
| Raw-colour linting | shadcn ships `@shadcn/lint`. |
| RTL | shadcn has it as an opt-in transform with manual exceptions. Strata's is by default. |
| Governance (RFCs, deprecation, codemods) | Not documented by any component library surveyed. |
| Published, reproducible evidence | Not found anywhere. This is the opening. |

## 2. Component libraries and marketplaces

| Tool | Solves | Gaps | Level |
|---|---|---|---|
| shadcn/ui | Copy-in components, registry, CLI; Radix or Base UI; OKLCH variables; MCP for registry discovery; CLI v4 with `--diff`; `@shadcn/lint`; RTL since Jan 2026 | Theming docs say nothing on contrast, multi-brand or token export. RTL needs manual migration for Calendar, Pagination, Sidebar and a `dir` on portals. No versioning or deprecation model. MCP is discovery only. | [V] |
| 21st.dev | Marketplace plus Magic MCP for agents | No stated quality control, accessibility, theming or consistency rules. Review process and payouts [U]. | [V] pricing, repo |
| Magic UI, Aceternity UI | Animated marketing components | Reduced-motion support reported as inconsistent | [S] |
| coss ui (ex Origin UI) | Base UI + Tailwind, copy-paste | Roadmap doesn't address RTL, theming or a11y guarantees | [V] roadmap |
| HeroUI v3 | React Aria + Tailwind v4; React Native library | v2 and v3 can't coexist; a hard break | [S] InfoQ |
| Tailwind Plus / Catalyst | Paid starter kit on Headless UI | Zip download; no RTL or multi-brand in docs | [V] |
| Base UI | Unstyled accessible primitives | No styling or theming layer, by design | [V] |
| Untitled UI React | React Aria + Tailwind, copy-paste. **Closest stack to Strata.** | Theming and RTL depth not checked. **Follow up before comparing.** | [V] intro only |
| tweakcn | Visual theme editor for shadcn, with a contrast checker | Checks, doesn't solve. Multi-brand and DTCG export [U]. | Weak |

**Unmet needs with sources**

1. Contrast is checked at best, never guaranteed — https://ui.shadcn.com/docs/theming
2. Semantic tokens are few and overloaded (`--input` used across 13 non-input components) — https://github.com/shadcn-ui/ui/issues/11763
3. Focus ring contrast fails in default styling. The author sells a competing kit; reproduce before citing — https://thefrontkit.com/blogs/shadcn-ui-accessibility-audit-2026
4. Upgrade and drift after copy-paste — https://github.com/shadcn-ui/ui/discussions/790 · https://ui.shadcn.com/docs/changelog/2026-03-cli-v4
5. No governance or deprecation path — https://www.infoq.com/news/2026/07/heroui-v3-rewrite/
6. RTL is partial and opt-in — https://ui.shadcn.com/docs/rtl · https://github.com/shadcn-ui/ui/issues/9233
7. Agent consistency is handled by discovery and lint, not audit — https://ui.shadcn.com/docs/registry/mcp · https://github.com/21st-dev/magic-mcp
8. Multi-brand is possible but hand-rolled — https://www.perpetualny.com/blog/accelerating-themeable-design-systems-with-shadcn-ui-a-step-by-step-guide

## 3. Theme generators

| Tool | Contrast | Output | Notes |
|---|---|---|---|
| Material Color Utilities / Theme Builder | **Guaranteed** by HCT tone difference | Full role set, light and dark | The real precedent. Exports Android XML, Compose, CSS, JSON. |
| Adobe Leonardo | Guaranteed against one background | Scales by ratio, not roles | |
| Radix custom palette | Stock scales guaranteed (APCA); custom palettes "similar" | 12-step scales | |
| tweakcn, Huetone, Accessible Palette, Colorbox | Checked only | Palettes or shadcn tokens | |
| Reasonable Colors, Harmony | Guaranteed by shade difference, fixed palettes | Palettes | Not generators from brand input |
| Primer, Atlassian, Carbon, Spectrum 2, Polaris | Hand-curated | Full tokens | Primer has 9 themes incl. high-contrast and colour-blind |
| Digdir Designsystemet | Claims sufficient contrast [U] | Tokens, CSS, Figma | Takes font and radius; maps forced-colors |
| Style Dictionary, Terrazzo, Tokens Studio, Supernova | None built in | Transport, not generation | Multi-brand pipelines are their strength |

**Already done by others:** seed colour to full role set with contrast by construction (Material) · OKLCH ramps and P3 · APCA targets · high-contrast themes · radius and font inputs · forced-colors mapping · DTCG 2025.10 export.

**Rare or not found**

- Published fuzz or property-test evidence of contrast over random brands.
- A brand fidelity metric (how far the solver moved the brand colour).
- Colour-blind-safe chart palettes generated per brand (Carbon and Primer hand-curate).
- State colours (hover, pressed, selected, focus ring) inside the guarantee [U].
- Density as a generator input.
- One generator exporting CSS, DTCG 2025.10, Figma variables and shadcn together.

**APCA / WCAG 3:** APCA left the WCAG 3 draft in July 2023; the April 2026 editor's draft says the algorithm is undecided. Nothing to conform to — http://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html

**Sources:** https://github.com/material-foundation/material-color-utilities · https://github.com/adobe/leonardo · https://www.radix-ui.com/colors/docs/overview/custom-palettes · https://tweakcn.com/ · https://primer.style/product/getting-started/foundations/color-usage/ · https://carbondesignsystem.com/data-visualization/color-palettes/ · https://www.reasonable.work/colors/ · https://evilmartians.com/opensource/harmony · https://designsystemet.no/en/fundamentals/themebuilder/own-theme/ · https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/

## 4. AI and design systems

| Area | Who | Does | Doesn't |
|---|---|---|---|
| MCP | shadcn, MUI, Carbon, Chakra, HeroUI, Primer | Docs, registry and token lookup | Validation |
| MCP | Figma | Design context, variables, Code Connect | Code audit |
| MCP | Storybook 10.3+ | Docs from manifest, runs tests incl. a11y | Token or drift audit |
| MCP | Atlassian | 16 tools incl. axe analysis and lint rules. **Most complete.** | Reproducible evals |
| Survey | "State of AI in Design Systems", Jul 2026 | 21 systems: 20 have MCP, 15 have llms.txt | Found no reproducible public eval |
| Lint | Atlassian, Primer, Polaris, SLDS | Token enforcement with autofix | System-specific |
| Drift | ds-drift, roast-my-design-system | Colours, spacing, imports | Native elements, physical properties, accessible names |
| Eval | Microsoft a11y-llm-eval | axe plus assertions, per model | Raw HTML only, no component library |
| Eval | Vercel next-evals | Public, per model | A framework, not a design system |
| Eval | ds-eval | 10 cases | No real model scores published |

**Claimed without a public harness:** Storybook MCP improvement figures; Atlassian accuracy and speed figures. Coinbase, Meta and Intuit eval claims are [U].

**Practitioner views:** agents ignore existing systems and default to shadcn/Tailwind (Storybook RFC) · prefer deterministic tools where output is verifiable; accessibility stays under-specified (Nathan Curtis, Jul 2026) · design systems need eval suites; typical assertions are shallow (Murphy Trueman, Jul 2026).

**Angles a solo project could own**

1. Reproducible, per-model agent eval with a public harness.
2. Accessibility eval through a component library, with and without MCP.
3. RTL and logical-property conformance in agent output.
4. Multi-brand eval: same task across tenants; do agents hard-code brand values?
5. Drift auditor covering all five Strata rule classes, with autofix, exposed over MCP.
6. Ablation of context delivery: MCP vs llms.txt vs AGENTS.md vs none.
7. Implemented trust levels (ADR-008).
8. Honest negative results and run-to-run variance.

**Sources:** https://state-of-ai-in-design-systems.netlify.app/ · https://storybook.js.org/docs/ai/mcp/overview · https://www.npmjs.com/package/@atlaskit/ads-mcp · https://github.com/microsoft/a11y-llm-eval · https://github.com/vercel/next-evals-oss · https://github.com/AndrewAntoshkin/ds-eval · https://github.com/sylwaninn/ds-drift · https://github.com/gregkozakiewicz/roast-my-design-system · https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals · https://blog.murphytrueman.com/design-systems-need-evals/ · https://bradfrost.com/blog/post/agentic-design-systems-in-2026/

## 5. Indian consumer companies

| Company | System | Platforms | Public? | Level |
|---|---|---|---|---|
| Razorpay | Blade | React + React Native from one package; ships an MCP; states white-labelling and accessibility | Yes, MIT | [S] |
| CRED | NeoPOP | Android, iOS, Flutter, web | Yes | [S][OLD] |
| Zomato | Sushi, compose-sushi | Android; Compose Multiplatform | Yes | [S] |
| Flipkart | Flipkart Design System, MURV | Figma variables theme one design across Flipkart, Grocery, Minutes; fonts for 11 Indian languages | No | [V] Figma case study |
| Swiggy | DLS | Native + web; token theming across verticals | No | [V][OLD] unofficial |
| PhonePe | Unnamed | Compose + SwiftUI; works with LiquidUI | No | [V] |
| Meesho | Mesh, Crystal | Unconfirmed | Blog only | [S] |
| Juspay | Blend | React | Yes | [S] |
| Freshworks | Crayons | Web components | Yes | [S] |

**Server-driven UI is common:** Flipkart multi-widget framework on React Native [S][OLD] · Swiggy Dynamic Widget [S] · PhonePe LiquidUI [S/V] · Zomato Kimchi [S][OLD]. Meesho, CRED, Paytm, Groww, Myntra [U].

**Job descriptions (thin evidence; most career pages were unreachable):** AI-enabled workflow · prototyping · systems and framework thinking · mentoring · research with tier-2+ users · stakeholder influence · scale. No current "Design Engineer" posting was found at these companies; that's "not found", not "doesn't exist".

**India-specific**

- Language: Flipkart supports 11 languages [V]. No company-published Indic line-height or truncation guidance was found.
- Law, **all from secondary sources; read the primary documents before quoting:** Supreme Court, *Pragya Prasun v. Union of India* (30 Apr 2025), accessible e-KYC · SEBI circular (31 Jul 2025) requiring WCAG and IS 17802 for regulated entities · RBI circular (14 Aug 2025).
- Multi-brand: Flipkart / Grocery / Minutes confirmed [V]. Shopsy and Cleartrip sharing it [U].

**Sources:** https://www.figma.com/customers/how-flipkart-boosts-its-design-vision-for-indian-e-commerce-with-figma/ · https://github.com/razorpay/blade · https://tech.phonepe.com/the-tale-before-the-design-system/ · https://tech.phonepe.com/introducing-liquidui-phonepes-server-driven-ui-framework/ · https://medium.com/swiggy-bytes/a-deep-dive-into-dynamic-widget-swiggys-server-driven-ui-system-92cdc3b16ec6 · https://blog.flipkart.tech/the-journey-of-react-native-flipkart-47dcd0c3d1c6 · https://github.com/Zomato/compose-sushi · https://engineering.razorpay.com/cutting-deep-through-blade-23a72bcc3bcc

## 6. Claims Strata must not make

- "shadcn has no RTL" or "no AI tooling". Both shipped in 2026.
- "First to guarantee contrast." Material is a precedent.
- APCA or WCAG 3 conformance.
- Any "first" or "only" without a fresh check on the day it's published.
- Anything about a company's internal design system. Say "here's how I'd approach a system for an app like yours."

## 7. Follow-ups

- [ ] Check Untitled UI React's theming and RTL in depth.
- [ ] Read live job descriptions on the companies' own career pages (Anuj).
- [ ] Read the Supreme Court judgment and the SEBI and RBI circulars at source.
- [ ] Reproduce the shadcn focus-ring contrast claim with a script before citing it.
- [ ] Re-run this research before Phase 6 (publish).
