# RFC-002: StreamingResponse — an AI answer that screen readers can follow

- **Status:** Accepted — Anuj, 2026-10-03 ([ADR-041](../adr/041-streaming-response-decisions.md))
- **Date:** 2026-10-02
- **Kind:** New component
- **Trust level:** Hard gate (GOVERNANCE.md §6). Claude drafted this RFC and built a prototype on
  `feat/ai-streaming-announcer` so it can be judged running; nothing merges until Anuj decides.
- **Research:** [docs/research/2026-10-02-ai-components.md](../research/2026-10-02-ai-components.md), gap 1.

## The need

- Any screen that shows a model's answer as it is written: a chat reply, an "explain this" panel, an
  agent's summary.
- Today, teams either make the answer container a live region, so a screen reader re-reads or chops the
  text on every token, or leave it silent, so a blind user does not know an answer is arriving or when it
  has finished. Neither tells "still writing" from "stopped" or "failed".
- No AI kit ships a fix (research, gap 1): AI Elements and prompt-kit put `role="log"` on the container;
  assistant-ui's `streaming-text` is a visual fade. GitHub Primer documents the problem but ships nothing.

## Proposal

```tsx
<StreamingResponse status={status} text={plainText}>
  <Markdown>{plainText}</Markdown>   {/* optional: what sighted users see; defaults to `text` */}
</StreamingResponse>
```

- `status: 'streaming' | 'complete' | 'stopped' | 'error'`. The app owns it; the component never guesses.
- `text`: the answer so far, as plain text. It is what gets spoken, so it never contains markdown
  symbols or code the app would not want read aloud.
- **What is spoken** (one polite live region, mounted before the first token and never re-created):
  1. On `streaming`: "Writing response" once.
  2. While streaming: each **finished sentence**, once, batched so announcements arrive at most every
     `announceInterval` ms (default 1000; a chosen value, not measured).
  3. On `complete`: whatever is left, then "Response complete". On `stopped`: what is left, then
     "Stopped". On `error`: "Couldn't finish" plus `errorMessage` if given; the unfinished last sentence is not read.
- **Sentences come from `Intl.Segmenter`** in the locale React Aria reports, not a regex, so the Hindi
  danda (।) and Arabic question mark (؟) end sentences correctly. Where the browser has no segmenter, it
  falls back to announcing at the end only.
- `announce="sentences" | "status"`: `status` speaks only the start and end lines, for long answers a user
  would rather read at their own pace. Default `sentences`.
- The visible text is **not** a live region. The whole thing is an `article` named by `label` (default "Response"),
  so a user can jump to it, without adding a landmark per message the way `region` would.
- **Visible status line**, shown while `streaming`, `stopped` or `error`, hidden once `complete`: an icon and
  words ("Writing…", "Stopped", "Couldn't finish"), never colour alone. The writing dot pulses only under
  `prefers-reduced-motion: no-preference`.
- Every spoken and visible word is a prop with an English default (`writingLabel`, `completeLabel`, …), the
  same pattern as Pagination.
- Tokens: `text.subtle` for the status line, `feedback.danger.fg` for the error icon, motion tokens for the
  pulse. No new tokens, no new colour pairs beyond ones the engine already proves.

## Extend, vary, add or override?

**Add.** No existing component speaks text as it arrives. Toast and Alert announce a finished message once;
TextArea's counter announces a threshold. Bolting this onto Card or a container prop would hide the
behaviour that is the whole point.

## Alternatives

- **A hook only (`useStreamAnnouncer`)**: most flexible, but every team would build the status line and the
  region labelling again, and get the visible half wrong. Possible later, alongside the component.
- **Make the container `aria-live` and throttle renders**: still re-reads changed text in some screen
  readers, and slows the visual stream to suit the audio one.
- **Announce only start and end**: simple and robust, but a long answer becomes a silent wait. Kept as the
  `announce="status"` option instead.

## Open questions for Anuj

1. **Name.** `StreamingResponse` (recommended: matches "response" in most AI APIs) vs `StreamingAnswer` vs
   `LiveResponse`.
2. **Default verbosity.** `sentences` (recommended) vs `status`.
3. **Hide the status line on `complete`** (recommended: a finished answer needs no badge) vs show "Done".

## Cost

- **Every tenant:** text and status only, on existing roles. Must be checked in all tenants, light and dark,
  RTL, both densities, and with real Hindi and Arabic answers (Haat, Qamar).
- **Consumers:** additive; nothing changes for existing code.
- **Maintenance:** one component, tests for segmentation per script and for each status transition. Real
  screen-reader runs (VoiceOver, NVDA) are manual and not yet done: jsdom cannot prove what is heard.

## Checklist before release

- [ ] `meta.json` (alpha), tests, examples and docs
- [ ] Manual VoiceOver (macOS) and NVDA (Windows) run, written up with what was heard
- [ ] Changeset for `@syntara/react`
- [ ] ADR for the three open questions, once decided
