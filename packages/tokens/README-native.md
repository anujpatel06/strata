# Native tokens: Jetpack Compose and SwiftUI

Every tenant gets two generated files:

| File | For |
|---|---|
| `dist/<id>/android/SyntaraTokens.kt` | Jetpack Compose (Kotlin), package `com.syntara.tokens` |
| `dist/<id>/ios/SyntaraTokens.swift` | SwiftUI |

**Tokens only.** Syntara has no native components and doesn't plan any (ADR-019). These files give an Android or iOS team the same colours, spacing, type and motion the web components use. They don't give them buttons.

**A brand is data.** Every tenant's file declares the same types and names. Nothing in the code is named after a brand. To switch brand, swap the file; no call site changes. (A test checks that the declarations are identical across tenants.)

**Where they come from.** `@syntara/theme-engine` writes them (`toCompose`, `toSwiftUI`), next to the CSS, DTCG and Figma exporters, with no runtime dependencies (ADR-001; own exporters rather than Style Dictionary, Anuj, 2026-09-28). They are built from the same values as the CSS: the output of `toCssVariables()`, both schemes, both densities. A token added to the CSS contract shows up here without anyone naming it.

Rebuild with `pnpm tokens`. Don't edit the files by hand.

## What the build checks

`pnpm tokens` writes each file, reads it back from disk, and fails (exit 1) if:

- any colour in the file differs from the theme, byte for byte, or a role is missing;
- any pair in `contrast-pairs.json` fails on the colours read back from the file.

Result on 2026-09-28 (`pnpm tokens`):

| Tenant | Contrast checks on the exported values |
|---|---|
| care | 236/236 |
| harbor | 236/236 |
| house | 236/236 |
| qamar | 236/236 |
| vela | 236/236 |

236 = 59 pairs × 2 schemes × 2 files. These are the same pairs, with the same ratios, as the engine's own 118 checks per tenant; a test asserts that.

## Android (Jetpack Compose)

Copy `SyntaraTokens.kt` into your module, for example `src/main/java/com/syntara/tokens/`. It needs Compose runtime, UI, foundation (for `isSystemInDarkTheme`) and animation-core (for `CubicBezierEasing` and `spring`). It doesn't need Material.

```kotlin
setContent {
    SyntaraTheme { // darkTheme = isSystemInDarkTheme(), density = the brand's default
        Box(
            Modifier
                .background(SyntaraTheme.colors.surfaceCanvas)
                .padding(SyntaraTheme.space.x4),
        ) {
            BasicText(
                "Pay now",
                style = TextStyle(
                    color = SyntaraTheme.colors.textDefault,
                    fontSize = SyntaraTheme.fontSize.md,
                    lineHeight = SyntaraTheme.lineHeight.normal,
                    letterSpacing = SyntaraTheme.tracking.md,
                    fontWeight = SyntaraTheme.fontWeight.medium,
                ),
            )
        }
    }
}
```

The shape of the API:

- **One `@Immutable data class` per group:** `SyntaraColors`, `SyntaraEffects`, `SyntaraSpace`, `SyntaraRadius`, `SyntaraFontFamilies`, `SyntaraFontSizes`, `SyntaraFontWeights`, `SyntaraLineHeights`, `SyntaraTracking`, `SyntaraMotion`, `SyntaraSpring`, `SyntaraIcon`, `SyntaraDensityTokens`.
- **`object SyntaraTokens`** holds every value: `LightColors`, `DarkColors`, `LightEffects`, `DarkEffects`, `ComfortableDensity`, `CompactDensity`, `Space`, `Radius`, and so on. Use it outside composition.
- **`CompositionLocal`s only where a value changes with a mode:** `LocalSyntaraColors` and `LocalSyntaraEffects` (scheme), `LocalSyntaraDensityTokens` (density). They have no default and throw if nothing provides them, so a missing `SyntaraTheme { }` fails loudly instead of showing light colours in dark mode.
- **`@Composable fun SyntaraTheme(darkTheme, density, content)`** provides them.
- **`object SyntaraTheme`** is how you read them: `SyntaraTheme.colors.textDefault`, `SyntaraTheme.density.controlHeight`, `SyntaraTheme.space.x4`. Constant groups are plain getters, not `CompositionLocal`s: they can't change, so there's nothing to provide.

Naming follows the web: `--syntara-font-size-md` is `SyntaraTheme.fontSize.md`, `--syntara-color-feedback-success-on-solid` is `SyntaraTheme.colors.feedbackSuccessOnSolid`. Keys that start with a digit are rewritten: space `4` is `x4` (4 × the 4 dp grid), size `2xl` is `xl2`. Each property's KDoc names its CSS variable. Constants use PascalCase, as the Compose API guidelines do.

We considered one `CompositionLocal` per group, the way Material does, and rejected it: most groups never change at runtime, and a local for each would only add places to forget a provider.

## iOS (SwiftUI)

Add `SyntaraTokens.swift` to your target. It imports only SwiftUI.

```swift
@main
struct PaymentsApp: App {
    var body: some Scene {
        WindowGroup { ContentView().syntaraTheme() } // or .syntaraTheme(density: .compact)
    }
}

struct PayButton: View {
    @Environment(\.syntaraColors) private var colors
    @Environment(\.syntaraDensity) private var density

    var body: some View {
        Text("Pay now")
            .font(SyntaraTheme.font(
                family: SyntaraTheme.fontFamily.body.first ?? "",
                size: SyntaraTheme.fontSize.md,
                weight: SyntaraTheme.fontWeight.medium
            ))
            .foregroundStyle(colors.actionPrimaryFg)
            .padding(.horizontal, density.controlPaddingInline)
            .frame(minHeight: max(density.controlHeight, 44)) // the platform minimum, see "Touch targets"
            .background(colors.actionPrimaryBg, in: RoundedRectangle(cornerRadius: SyntaraTheme.radius.button))
    }
}
```

The shape of the API:

- **One `Equatable, Sendable` struct per group,** with the same names as on Android.
- **Scheme and density values are static on their struct:** `SyntaraColors.light`, `SyntaraColors.dark`, `SyntaraColors.forScheme(_:)`, `SyntaraDensityTokens.comfortable`, `.forDensity(_:)`.
- **Constant groups live on `enum SyntaraTheme`:** `SyntaraTheme.space.x4`, `SyntaraTheme.radius.button`, plus `SyntaraTheme.font(family:size:weight:)`.
- **Light and dark are resolved through the environment's `colorScheme`.** `.syntaraTheme()` reads `colorScheme` where you apply it and sets `\.syntaraColors`, `\.syntaraEffects` and `\.syntaraDensity`. If a subtree sets its own `colorScheme` below that point (with `.environment(\.colorScheme, …)`), apply `.syntaraTheme()` again inside it. Without the modifier, the environment holds the light colours.

We rejected dynamic colours (`UIColor { traits in … }`) and asset catalogs. Both resolve light and dark on their own, even in UIKit, which is a real advantage. But dynamic colours need separate UIKit and AppKit code, and an asset catalog is a folder of JSON files rather than one Swift file. With the environment approach, the file is plain SwiftUI that we can type-check here (see "Was it compiled?"), and `SyntaraColors.light` and `.dark` are plain values that tests can compare. If your app mixes UIKit and SwiftUI, an asset catalog generated from the same values would be the better fit. It isn't built yet.

## Colour

The engine's final colours are 8-bit sRGB hex values, and the contrast solver checked those exact bytes. The files write the same bytes:

- Compose: `Color(0xFFRRGGBB)`, which Compose stores in sRGB.
- SwiftUI: `Color(.sRGB, red: RR / 255, green: GG / 255, blue: BB / 255)`, through the file's `srgb(0xRRGGBB)` helper.

Nothing is converted to Display P3 or re-derived from OKLCH. That would change the values, and the contrast checked on the web would no longer be the contrast the app shows. On a wide-gamut screen, the system colour-manages sRGB, so the colour looks the same.

Colours the web writes as `color-mix(in srgb, <colour> N%, transparent)` (the rim, the glass background, the glow) are the same colour at N% alpha. That's exact: mixing with transparent in sRGB only scales the alpha. Colours the web writes as `var()` of a role (`chartGrid`, `chartAxis`) carry the role's bytes. A comment next to each value says which role it follows.

## Units

| Web | Compose | SwiftUI |
|---|---|---|
| px (space, radius, density, blur) | `Dp` (1 px = 1 dp) | `CGFloat` points (1 px = 1 pt) |
| px (font sizes) | `TextUnit` in **sp** | `CGFloat` points; use `SyntaraTheme.font(…)` for Dynamic Type |
| em, or a unitless line height | `TextUnit` in em | `CGFloat`, a multiple of the font size |
| ms | `Int` milliseconds | `TimeInterval` seconds |
| `cubic-bezier()` | `CubicBezierEasing` | `SyntaraCubicBezier`, with `.animation(duration:)` |
| font weight (400…) | `FontWeight(400)` | `Font.Weight` (`.regular` …) |

1 px = 1 dp = 1 pt is the usual convention. All three are density-independent units, not physical ones.

**Font sizes follow the user's text size.**

- Android: sizes are `sp`, so they follow the system font scale. Android 14 and later scale large sizes less than small ones (non-linear font scaling). That's the platform's choice, and we keep it.
- iOS: sizes are points at the default text size. `SyntaraTheme.font(family:size:weight:)` returns `Font.custom(family, size:, relativeTo:)`, so the size follows Dynamic Type. It scales relative to the Apple text style whose default size (at the Large content size) is nearest. Ties go to the larger style. For the current scale that means 12 → caption, 13 → footnote, 14 → subheadline, 16 → callout, 20 → title3, 24 → title2, and 32, 40 and 48 → largeTitle. This mapping is a suggestion. If you want a different curve, pass your own text style to `Font.custom`.

**Line height.** The value is a multiple of the font size, as in CSS.

- Compose: `TextStyle(lineHeight = SyntaraTheme.lineHeight.normal)` does exactly that.
- iOS: the exact equivalent is `NSParagraphStyle` with minimum and maximum line height both set to multiple × point size. SwiftUI's `.lineSpacing()` adds space between lines instead, so pass (multiple × size) − the font's own line height.

**Tracking.** The value is a multiple of the font size.

- Compose takes em directly: `letterSpacing = SyntaraTheme.tracking.md`.
- SwiftUI `.tracking()` takes points: pass value × size.
- Tracking is 0 for type pairs whose script must not be letter-spaced (Arabic, Devanagari).

**Fully round.** A radius of 9999 means "fully round". Use `CircleShape`, `RoundedCornerShape(percent = 50)` or `Capsule()` rather than relying on a shape API to clamp 9999.

## Touch targets

The density tokens are the web design values. They are exported unchanged. The compact `controlHeight` is 32, and comfortable is 40. Both are below the platform minimums:

- Android: 48 dp (Material and Android accessibility guidance).
- iOS: 44 × 44 pt (Apple Human Interface Guidelines).

Native controls must still meet those minimums. Draw the control at `controlHeight` if you want the web look, and give it a larger touch area:

- Compose: `Modifier.sizeIn(minHeight = 48.dp)` (or Material's `minimumInteractiveComponentSize()` if you use Material).
- SwiftUI: `.frame(minHeight: 44)` with `.contentShape(Rectangle())`.

The files don't raise the values themselves. A silent change would make the native design differ from the web one without anyone deciding it.

## Right to left

The tokens carry no direction. Both platforms mirror layouts from the locale: Compose through `LocalLayoutDirection`, SwiftUI through `layoutDirection`. Use start/end (`padding(start = …)`, `.leading`/`.trailing`), never left/right. For Arabic tenants, tracking is 0 because letter-spacing breaks joined script.

## What CSS has that native doesn't, token by token

| CSS variable | Native | Why |
|---|---|---|
| `--syntara-shadow-raised`, `--syntara-shadow-overlay`, `--syntara-shadow-highlight`, `--syntara-glow` | **Exported as data:** a list of `SyntaraShadowLayer` (colour with alpha, offsetX, offsetY, blur, spread, inset) | Layered CSS shadows have no single native equivalent. Compose's `Modifier.shadow()` takes one elevation, not layers. SwiftUI can stack one `.shadow()` per layer but has no spread or inset, and its `radius` isn't the CSS blur length, so check the result by eye. `highlight` is an inset shadow: neither platform has one, so it needs custom drawing. We export the data rather than a guessed elevation. |
| `--syntara-glass-bg`, `--syntara-glass-opacity`, `--syntara-glass-blur` | **Exported:** `glassBg` (surface.raised at the solved opacity), `glassOpacity`, `glassBlur` | The opacity was solved so that body and secondary text keep 4.5:1 on the glass over a pure black or pure white backdrop, blended in 8-bit sRGB as browsers do. We haven't measured how Android's or iOS's compositor blends, so treat that guarantee as the web's. Backdrop blur: Compose's `Modifier.blur` blurs the element's own content, not what's behind it. Android needs `RenderEffect` (API 31+) or another approach. On iOS, SwiftUI's `Material` is the platform's blur, and its tint isn't `glassBg`. |
| `--syntara-rim` | **Exported:** a colour with alpha (text.default at 10% light, 18% dark) | Exact: see "Colour". |
| `--syntara-motion-easing`, `--syntara-motion-easing-out`, durations | **Exported** | `CubicBezierEasing`; `SyntaraCubicBezier.animation(duration:)`. |
| `--syntara-motion-spring` | **Left out** | A CSS `linear()` easing sampled from a spring. Neither platform takes a sampled curve. The spring itself is exported as `spring` (mass 1, stiffness 400, damping 28): Compose `SyntaraTheme.spring.spec()` (which calls `spring(dampingRatio, stiffness)`), SwiftUI `SyntaraTheme.spring.animation` (which calls `interpolatingSpring`). `durationSpring` is the time the web curve takes to settle. |
| `--syntara-sheen` | **Left out** | A CSS `linear-gradient` (dark scheme only; `none` in light). Its angle is measured against the web box, so it has no fixed native value. It's decoration: a band of text.default at low opacity. An app that wants it can draw it with `Brush.linearGradient` or `LinearGradient`. |
| `--syntara-hairline` | **Left out** | One device pixel on the web: 1px, or 0.5px on 2× screens through a media query. Both platforms have this built in: Compose `Dp.Hairline`, SwiftUI `1 / displayScale` from the environment. |
| `--syntara-font-heading`, `--syntara-font-body`, `--syntara-font-mono` | **Exported as family names,** in fallback order | Only the families the type pair loads are kept. Web fallbacks (`system-ui`, `Segoe UI` and so on) are dropped, because the system font is the native fallback. **The app must bundle these fonts and follow their licences.** We haven't reviewed the licences for app distribution, so check each family before shipping. On Android, map each name to a `FontFamily` with your bundled files (or downloadable fonts). On iOS, register the files (`UIAppFonts`) and pass the name to `SyntaraTheme.font(…)`. |
| `--syntara-chart-grid`, `--syntara-chart-axis` | **Exported** with the role's bytes | They are `var()` aliases on the web. |
| `--syntara-icon-stroke` | **Exported** | Unitless, in Syntara's 24 × 24 icon grid. Syntara's icons themselves are SVG and React only. There is no native icon export. |

Not CSS variables, so not in the files:

- **Ramps (primitives).** Components must never need them (BRIEF principle 1). They are in `<id>.tokens.json` if a tool needs them.
- **The `2dppx` hairline override.** See `--syntara-hairline` above.

A test checks that every CSS variable the engine emits is either exported or listed above (`packages/theme-engine/test/native-exporters.test.ts`, "no silent omissions"). A new variable whose value has no native form stops the build until someone adds a rule or an exclusion with a reason.

## Was it compiled?

- **Swift: yes, type-checked.** Every tenant's file passes `swiftc -typecheck -swift-version 6 -warnings-as-errors -target arm64-apple-macos14.0`. This ran with Apple Swift 6.3.3 from the Command Line Tools, against the **macOS** SDK. The iOS SDK isn't installed here, so the file has not been built for iOS. It uses only SwiftUI API that exists on iOS too (`Color`, `Font`, `Animation`, `EnvironmentValues`, `ViewModifier`), but that is our reading of the API, not a build. The test runs `swiftc` whenever it's installed.
- **Kotlin: no.** There is no Kotlin compiler or Android toolchain on this machine, so `SyntaraTokens.kt` has **not** been compiled. Tests check its structure instead:
  - brackets are balanced;
  - every instance sets exactly its class's fields, in order;
  - every type is imported or declared, and every import is used;
  - no identifier is a Kotlin keyword without backticks.

  The first Android build is the real check. Please report anything it finds.
