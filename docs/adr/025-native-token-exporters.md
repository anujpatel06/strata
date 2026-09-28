# ADR-025: Native token files keep the engine's exact colours, and say what wasn't compiled

- **Status:** Accepted for the approach — **Claude recommended, Anuj accepted** (own exporters, 2026-09-28). The API shape of the generated files is **Claude recommended, pending Anuj**.
- **Date:** 2026-09-28
- **Principles:** 1, 2, 3

## Context

- ADR-019 asked for Compose and SwiftUI token files, with contrast re-checked on what was exported. ADR-001 keeps the engine free of runtime dependencies.
- No Android toolchain and no iOS SDK are installed on the machine that built this.

## Decision

- **Two exporters in the theme engine,** built on the output of `toCssVariables`, so a new token reaches them without being named.
- **Colours are the engine's 8-bit sRGB values, byte for byte.** No conversion to Display P3 and no re-deriving from OKLCH, because either would change the contrast the engine solved.
- **The token build re-checks.** It writes each file, reads the colours back from disk, compares them with the theme, and runs every contrast pair on them. It fails on any difference. 236 checks per tenant — `pnpm tokens`.
- **Nothing is dropped silently.** A test asserts that every CSS variable is exported or on a written list with a reason. Left out: the spring's `linear()` curve (its physics are exported), the sheen gradient, the hairline, and the ramps.
- **No tenant name in any identifier.** Changing brand means swapping the file, not renaming call sites.
- **Sizes are exported as designed.** Control heights of 32 and 40 are below the platforms' minimums of 48dp and 44pt. The README says native controls must still meet them.
- **Claims match what was run.** The Swift files were type-checked with `swiftc` against the macOS SDK. They weren't built for iOS. The Kotlin files have never been compiled.

## Alternatives considered

- **Style Dictionary downstream:** the industry default, with ready transforms. It adds a dependency and a second model, and the exact-bytes re-check would still be ours to write.
- **Display P3 on iOS:** richer colour, but different values from the ones the contrast was solved on.
- **Raise control heights to the platform minimum in the export:** safer by default, but the file would no longer match the design, and it hides a decision that belongs to the native component.

## Consequences

- **Good:** the contrast guarantee carries to the exported values, and the build proves it.
- **Bad:** the Kotlin file is unproven until the first Android build. Glass wasn't measured on native compositors, so its 4.5:1 holds for browsers only. Fonts are exported as names; the app bundles them, and their licences weren't checked. Shadows are data, not ready modifiers.
- **Revisit when:** someone compiles the Kotlin file or builds for iOS; a native component is written; a token with no native form is added.
