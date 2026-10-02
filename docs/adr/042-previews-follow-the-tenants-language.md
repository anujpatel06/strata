# ADR-042: Component previews speak the tenant's language

- **Status:** Accepted — **Anuj** chose the scope ("direction now, words step by step") and kept the direction
  toggle as an override (2026-10-03). The way the Code tab stays English (stripping `t()` calls) is **Claude
  recommended, pending Anuj**. Anuj reviewed the Arabic and Hindi wording of the Button examples (2026-10-03).
- **Date:** 2026-10-03
- **Scope:** `apps/docs` only — the component preview frame, `lib/examples.ts`, `examples/_copy/`, and Button's
  seven examples. No component, token or tenant data changes.

## Context

- Anuj: "this language should happen in all components if I change the theme". Before this, a preview's locale
  came only from the direction toggle (`rtl` → `ar-AE`, else `en-US`), so picking Qamar still showed an English,
  left-to-right preview.
- Example words are typed in English in ~200 files, and the Code tab shows each file verbatim for readers to copy.

## Decision

1. **The preview takes the tenant's `locale` and `dir` from its `content.json`** (Qamar `ar-AE-u-nu-latn`, rtl;
   Haat `hi-IN`). Dates, numbers, calendars and React Aria's keyboard direction follow in every component.
2. **The direction toggle overrides** until the tenant changes. Flipped against the tenant, the preview uses a
   stand-in locale for that direction (`ar-AE` / `en-US`) so any tenant can be checked both ways.
3. **Example words translate through `useCopy()`** (`examples/_copy/use-copy.ts`): `t('Save draft')` looks the
   English up in `_copy/ar.json` / `_copy/hi.json`, falling back to English. One list per language, so a reviewer
   reads one file.
4. **The Code tab never shows it.** `stripCopy` in `lib/examples.ts` removes the import, the hook line and the
   `t()` wrappers. For Button's seven examples the stripped source is byte-identical to the pre-change files.
5. **Rolled out one component at a time**, Button first.

## Consequences

- Calls must stay single string literals, `t('…')` or `t("…")`, or stripping is no longer exact.
- Until every component is converted, Qamar previews show English words inside a right-to-left layout.
