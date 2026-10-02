# AI components: what exists, what doesn't (2026-10-02)

Question (Anuj): which AI components could Syntara build that are not on the market yet?
Method: two web-research passes (market inventory; unmet AI UX patterns), then the
contradictions between them checked by hand against assistant-ui's repo
(`gh api repos/assistant-ui/assistant-ui/contents/apps/docs/content/elements` lists 127 element pages).

## Headline

The chat basics are commodity, and most of the "obvious new" ideas shipped in 2026, mostly in
Vercel AI Elements and assistant-ui. What is still open is where AI UI meets **accessibility,
regulation and multilingual text**, which is exactly where Syntara is already strong (contrast
solver, RTL, Hindi and Arabic tenants, React Aria, server-driven UI).

## Already taken (do not build as "new")

| Idea | Who ships it |
|---|---|
| Message, composer, thread, reasoning, tool call, sources, suggestions, attachments, code block, loader | 4+ libraries each (AI Elements, assistant-ui, prompt-kit, Ant Design X, CopilotKit, LlamaIndex, shadcn, Tambo) |
| Tool approval / permission prompt | AI Elements `Confirmation`, assistant-ui `ApprovalCard`, `PermissionGrant` |
| Plan, task, queue, checkpoint | AI Elements, assistant-ui |
| Context / token / cost meter | AI Elements `Context`, assistant-ui `CostMeter`, `ContextBreakdown` |
| Confidence marker (grounded / inferred / uncertain) | assistant-ui `confidence-marker` (keyboard and `aria-describedby` documented) |
| Background-task inbox | assistant-ui `background-inbox` |
| Memory list (removable) | assistant-ui `memory-chips` |
| Feedback with reasons | assistant-ui `feedback-dialog`, prompt-kit `FeedbackBar` |
| Refusal / guardrail notice | assistant-ui `guardrail-notice` |
| Generic "AI" label with explanation popover, revert-to-AI on form fields | IBM Carbon for AI |
| Agent asks the user questions | shadcn `Questionnaire`, AI Elements `Question`, Tambo `Elicitation` |

## Real gaps (checked)

1. **Accessible streaming announcer.** Screen readers re-read the whole answer per token or drop
   updates, and can't tell "still writing" from "stopped". No library ships a component for it.
   assistant-ui `streaming-text` is a visual fade only (`aria-hidden` caret, no live-region logic).
   AI Elements and prompt-kit only put `role="log"` on the container. GitHub Primer has guidance, no
   component (https://primer.style/accessibility/patterns/copilot-accessibility-practices/).
   Hard part, and our edge: announce at sentence ends in every script (Arabic `؟ ،`, Devanagari `।`),
   say "done" / "stopped", and offer "read the full answer".
2. **AI disclosure and provenance label.** EU AI Act Article 50 labelling obligations apply from
   2 Aug 2026 (https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act).
   C2PA publishes UX guidance for a "content credentials" pin
   (https://spec.c2pa.org/specifications/specifications/2.2/ux/UX_Recommendations.html).
   Carbon's AI label is the nearest thing and is a generic marker: no "AI-generated vs AI-assisted",
   no C2PA reading, no legal wording per locale. No mention of C2PA, Article 50, disclosure or
   provenance in the assistant-ui element docs we downloaded. Unverified: the official EU icon's
   artwork and licence.
3. **Prose and form-field change review.** Accept or reject each AI edit in text or data, not code.
   assistant-ui `reviewable-diff` works on patch hunks (code), and AI Elements' `Commit` is code too.
   Gemini in Docs does this for prose, as a product feature, not a component
   (https://support.google.com/docs/answer/13447609). Hard part: insertions and deletions without
   relying on colour (WCAG 1.4.1), keyboard travel between changes, and diffing whole characters so
   Arabic joining and Devanagari conjuncts (क्ष) never split.
4. **Mixed-direction AI output.** Citation markers, source chips and English quoted inside Arabic or
   Hindi answers flip or reorder while streaming. assistant-ui has an RTL page with a `<bdi>` tip; no
   kit handles streamed mixed-script text. This is our own reasoning from the Unicode bidi algorithm,
   not a published study, so a demo should prove it first.
5. **Proof, not claims.** No library documents a conformance level per AI component (Carbon AI Chat
   states one for the product), and none theme AI components from brand inputs. This is a property of
   all of the above, not a separate component.

Partly open, not checked deeply enough to claim: a screen to **review and revoke standing
permissions** (assistant-ui grants them; whether it manages them later is unverified), and a
reduced-motion spec for shimmers, orbs and "generative borders".

## Fit with Anuj's AI Trust Patterns (BRIEF §7)

The three friction levels map onto the gaps:
- **Ambient:** disclosure label (1 line, always on), streaming announcer.
- **Soft gate:** prose and field change review.
- **Hard gate:** already commodity (approval cards). Syntara's version should exist for completeness
  but is not the differentiator.

## Sources

Market inventory: AI Elements https://elements.ai-sdk.dev, assistant-ui https://www.assistant-ui.com,
prompt-kit https://www.prompt-kit.com/llms.txt, Ant Design X https://x.ant.design/components/overview,
CopilotKit https://docs.copilotkit.ai/reference, Carbon for AI
https://carbondesignsystem.com/guidelines/carbon-for-ai/, Carbon AI Chat
https://chat.carbondesignsystem.com, shadcn https://ui.shadcn.com/docs/components/message,
Tambo https://ui.tambo.co, Atlassian Rovo https://atlassian.design/rovo-ui.
Patterns: Shape of AI https://www.shapeof.ai/, Microsoft HAX
https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/, Google PAIR https://pair.withgoogle.com/guidebook/,
Smashing (Feb 2026) https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/.
Unverified or unreachable: prompt-kit's site (403/504; catalogue taken from llms.txt), Microsoft Fluent
AI (gated), Material/Gemini, Thesys C1 (now OpenUI).
