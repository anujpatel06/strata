'use client';

import { useCallback, useContext, useEffect, useRef, useState, type JSX, type Ref } from 'react';
import {
  OverlayArrow,
  Tooltip as RACTooltip,
  TooltipContext,
  TooltipTrigger as RACTooltipTrigger,
  TooltipTriggerStateContext,
  composeRenderProps,
  useSlottedContext,
  type TooltipProps as RACTooltipProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import styles from './tooltip.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. At open time copy the trigger's scope attributes
 * (data-strata-theme/scheme/density) and dir/lang onto the overlay root so it resolves the same tokens.
 */
const SCOPE_ATTRS = ['data-strata-theme', 'data-strata-scheme', 'data-strata-density'] as const;
function mirrorScope(overlay: HTMLElement, source: Element | null | undefined): void {
  if (!source || overlay.contains(source)) return;
  for (const name of SCOPE_ATTRS) {
    // Look each attribute up on its own: a single-tenant app themes :root and scopes only the scheme.
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
  for (const name of ['dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
}

/** What a person does to scroll. A scroll with none of these before it came from the browser, moving focus into view. */
const SCROLL_INPUTS = ['wheel', 'touchmove', 'pointerdown', 'keydown'] as const;

function hasKeyboardFocus(el: Element | null | undefined): boolean {
  if (!el || el !== document.activeElement) return false;
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

export interface TooltipProps extends RACTooltipProps {
  /** Draws a small arrow pointing at the trigger. */
  showArrow?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A short text label shown on hover or keyboard focus of its trigger. Never put interactive content or essential
 * information in a tooltip — it is unreachable on touch devices.
 */
export function Tooltip({ showArrow = true, children, className, offset, ref, ...props }: TooltipProps): JSX.Element {
  const contextTriggerRef = useSlottedContext(TooltipContext)?.triggerRef;
  const source = props.triggerRef ?? contextTriggerRef;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) mirrorScope(node, source?.current);
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [source, ref],
  );

  // When one tooltip replaces another, React Aria closes the first with `shouldSkipAnimation`. On Tab out of a
  // toggle group (focus passes through the group's last item) that leaves the closed tooltip mounted as
  // `[data-exiting]` with no position, for good (docs/upstream/react-aria-tooltip-stays-mounted.md). So React
  // Aria always gets the animated path, and the swap stays instant through `[data-instant]`, which switches
  // the animation off in CSS.
  const state = useContext(TooltipTriggerStateContext);
  const isOpen = state?.isOpen === true;

  // A toggle group or toolbar moves focus to its last item on Tab, so that the browser's Tab leaves the group.
  // That item's tooltip opens and closes before the browser paints. It never appeared, so it must not fade out.
  const [wasPainted, setWasPainted] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    setWasPainted(false);
    const frame = requestAnimationFrame(() => setWasPainted(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const isInstant = state?.shouldSkipAnimation === true || (state != null && !isOpen && !wasPainted);

  // React Aria closes a tooltip when the page scrolls. Keyboard focus scrolls its control into view, so a tooltip
  // opened by focus closed at once, and keyboard users never saw it. While the trigger has keyboard focus, only a
  // scroll the person made closes the tooltip. Blur and Escape go through the trigger's own state, as before.
  const userScrolled = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    userScrolled.current = false;
    const mark = () => {
      userScrolled.current = true;
    };
    for (const type of SCROLL_INPUTS) window.addEventListener(type, mark, { capture: true, passive: true });
    return () => {
      for (const type of SCROLL_INPUTS) window.removeEventListener(type, mark, { capture: true });
    };
  }, [isOpen]);
  const tooltipState = state && {
    ...state,
    shouldSkipAnimation: false,
    close: (immediate?: boolean) => {
      if (immediate && !userScrolled.current && hasKeyboardFocus(source?.current)) return;
      state.close(immediate);
    },
  };

  return (
    <TooltipTriggerStateContext.Provider value={tooltipState}>
      <RACTooltip
        {...props}
        ref={setRef}
        data-instant={isInstant || undefined}
        offset={offset ?? (showArrow ? 8 : 6)}
        className={composeRenderProps(className, (c) => cx(styles.tooltip, c))}
      >
        {composeRenderProps(children, (content) => (
          <>
            {showArrow && (
              <OverlayArrow className={styles.arrow}>
                <svg viewBox="0 0 8 8" aria-hidden>
                  <path d="M0 0 L4 4 L8 0" />
                </svg>
              </OverlayArrow>
            )}
            {content}
          </>
        ))}
      </RACTooltip>
    </TooltipTriggerStateContext.Provider>
  );
}

export type TooltipTriggerProps = TooltipTriggerComponentProps;

/**
 * Wraps a focusable trigger (usually a Button) and its Tooltip. Opens after `delay` ms of hover, immediately on
 * keyboard focus, and closes on blur, pointer leave or Escape.
 */
export function TooltipTrigger({ delay = 600, closeDelay = 0, ...props }: TooltipTriggerProps): JSX.Element {
  return <RACTooltipTrigger {...props} delay={delay} closeDelay={closeDelay} />;
}
