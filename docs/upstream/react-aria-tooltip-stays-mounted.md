# Draft issue for adobe/react-spectrum (not posted)

**Title:** Tooltip stays mounted with `data-exiting` at 0,0 after Tab leaves a ToggleButtonGroup

## Description

Tooltips on the buttons of a `ToggleButtonGroup` stay in the DOM after keyboard focus leaves the group. Each one keeps `role="tooltip"` and `data-exiting`, has no position, and so renders at the top-left of the page. They are never removed.

Tooltips on plain `Button`s, with the same markup otherwise, unmount as expected.

## Versions

- react-aria-components 1.21.1, react-aria 3.52.1, react-stately 3.50.0
- react and react-dom 19.3.0
- Chromium (Playwright 1.56.0), macOS. Same in a Vite dev server and a production build.

## Steps

```tsx
import { ToggleButton, ToggleButtonGroup, Tooltip, TooltipTrigger } from 'react-aria-components';

export function App() {
  return (
    <div style={{ padding: 100 }}>
      {['One', 'Two', 'Three'].map((label) => (
        <ToggleButtonGroup key={label} aria-label={label}>
          <TooltipTrigger delay={500}>
            <ToggleButton id={label}>{label}</ToggleButton>
            <Tooltip>{label} tip</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger delay={500}>
            <ToggleButton id={label + '2'}>{label}2</ToggleButton>
            <Tooltip>{label}2 tip</Tooltip>
          </TooltipTrigger>
        </ToggleButtonGroup>
      ))}
    </div>
  );
}
```

No CSS is needed.

1. Press Tab to focus "One". Its tooltip opens.
2. Press Tab again. Focus moves to "Two".
3. Run `document.querySelectorAll('[role="tooltip"]')`.

## Expected

One tooltip, "Two tip".

## Actual

Two tooltips. "One tip" is still mounted with `data-exiting`, at 0,0. Each further Tab leaves one more:

```
Tab 1  focus One    One tip@105,90
Tab 2  focus Two    One tip@0,0 [data-exiting] ; Two tip@104,111
Tab 3  focus Three  One tip@0,0 [data-exiting] ; Two tip@0,0 [data-exiting] ; Three tip@104,132
```

They are still there 1.5s later.

## What we saw

On Tab, the group moves focus to its last item before the browser moves focus out. The focus events in order: `focusout One`, `focusin One2`, `keydown Tab` (target One), `focusout One2`, `focusin Two`. So "One2 tip" opens while "One tip" is open, and closes again at once.

We think this is the `shouldSkipAnimation` path added for swapping between tooltips, but we have not traced it to a line. What we can say: when our wrapper gives `Tooltip` a `TooltipTriggerStateContext` value with `shouldSkipAnimation: false`, the tooltips unmount correctly.
