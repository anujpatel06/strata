# ADR-035: A date field picks its own space before AM, rather than taking Intl's

- **Status:** Accepted — **Claude** (pending Anuj's review).
- **Date:** 2026-09-29
- **Principles:** 7

## Context

- `/docs/components/date-picker` threw React error #418 on the deployed site, on every visit, and nowhere else: clean locally, clean in CI, in both schemes.
- Ruled out first, each by measurement: the CSP (it failed with the policy bypassed), Google Fonts, the browser's locale (`en-US`, `en-GB`, `en-IN`, `de-DE` all rendered identical segments), the browser's timezone (`UTC`, `Asia/Kolkata`, `America/Los_Angeles`, `Pacific/Kiritimati` all failed), `NEXT_PUBLIC_SITE_URL`, and the build itself — this machine's build and Cloudflare's emitted byte-identical visible text.
- The cause was one character. Diffing the served HTML against the hydrated DOM **including whitespace-only text nodes** — the earlier comparisons had stripped them, which is why they found nothing — showed the two agreeing everywhere except the separator before "AM":

  | | code point |
  |---|---|
  | server, Cloudflare's Node | `U+202F` narrow no-break space |
  | client, the browser | `U+0020` ordinary space |

- CLDR 42 changed that separator from `U+0020` to `U+202F`. Which one `Intl.DateTimeFormat` produces therefore depends on the runtime's data, and the runtime that prerenders a page is not the one that hydrates it. Local and CI both passed because each has one ICU on both sides.
- This is the same shape as ADR-033 (compact notation): an Intl output that is not stable across ICU versions, reached through a component.

## Decision

- **A separator segment that is only spaces renders as `U+202F`**, whatever Intl produced. One character, chosen by the component, identical on both sides of hydration.
- **`U+202F` and not `U+0020`**, because it is the modern value and the correct one here: a time should not wrap between "9:30" and "AM".
- **Only separators that are entirely space-like** (`U+0020`, `U+00A0`, `U+2009`, `U+202F`). Anything with other characters in it — `/`, `.`, `, ` — is left exactly as the locale wrote it.
- Normalising, rather than `suppressHydrationWarning` as ADR-033 chose for compact numbers, because here the output can be made the same on both sides. Suppression would have left the reader seeing whichever space the build machine happened to have.

## Alternatives considered

- **`suppressHydrationWarning` on the segment.** Consistent with ADR-033 and a smaller change, but it pins the character to the build machine and hides any genuine mismatch in that text later. Normalising is available here and better; ADR-033 had no equivalent, because a whole compact figure cannot be reconstructed from one rule.
- **Pin the whole app to one ICU.** Not possible: the browser's is the reader's.
- **Leave it.** React discards the server HTML and re-renders the page on the client, on every visit, for every reader whose browser data differs from the build's.

## Consequences

- **Good:** the page hydrates, and the separator is the same character for every reader regardless of what built the site or what they browse with.
- **Good:** it is a fix rather than a suppression, so a real mismatch in that text would still be caught.
- **Bad:** if a locale ever wants a plain space there on purpose, it will not get one. No locale in the system does.
- **Bad:** the same hazard remains anywhere else Intl's output reaches the DOM. `Amount`'s non-compact path formats currency, and `de-DE` puts `U+00A0` before the `€` — it agrees across the runtimes in use today, and nothing checks that it will keep agreeing.
- **Revisit when:** another Intl-formatted string is found differing across runtimes; the honest answer then may be a single rule about where Intl output may reach the DOM, rather than a third case-by-case fix.
