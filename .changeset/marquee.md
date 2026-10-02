---
'@syntara/react': minor
---

Add `Marquee` (alpha): a strip of logos, quotes or badges that scrolls by itself in a seamless loop.

It meets WCAG 2.2.2 (Pause, Stop, Hide): a visible pause toggle, a pause on hover (`pauseOnHover`, default on)
and whenever anything inside has keyboard focus. Under `prefers-reduced-motion` nothing moves and the items wrap.
Screen readers get one copy of the items as a list in a labelled region; the copies that make the loop seamless are
`aria-hidden` and `inert`. The pace comes from the strip's width (`speed`: `slow`, `md`, `fast`), so a long strip
moves no faster than a short one, and it travels towards the start of the line, so rightwards in right-to-left pages.
