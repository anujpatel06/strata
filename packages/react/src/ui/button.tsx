'use client';

import { Children, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, type JSX, type ReactNode, type Ref } from 'react';
import { Button as RACButton, composeRenderProps, type ButtonProps as RACButtonProps } from 'react-aria-components';
import styles from './button.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * `'danger'` is deprecated (since 0.2.0, removed in 1.0.0; use `tone="danger"`, RFC-001). It stays in this exported
 * type until then, because narrowing the type would break code that's typed with it.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'contrast' | 'danger';
export type ButtonTone = 'neutral' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonBaseProps extends Omit<RACButtonProps, 'aria-label' | 'aria-labelledby'> {
  /**
   * Visual style. `primary` for the one main action in a view.
   * `contrast` is the monochrome strong action (near-black in light schemes, near-white in dark): use it when
   * brand colour should stay rare, e.g. a form's submit next to a brand-coloured page hero.
   *
   *
   * Deprecated value: `'danger'`, since 0.2.0, removed in 1.0.0. Use `tone="danger"` instead; the old value renders
   * as before until then. Codemod: `npx @strata/codemods button-variant-danger-to-tone <path>`. RFC-001.
   * (No `@deprecated` tag here: it would strike through every use of `variant`, not only this value.)
   */
  variant?: ButtonVariant;
  /**
   * Feedback colour. `danger` marks a destructive action and works with the `primary`, `outline` and `ghost`
   * variants. The other variants ignore it and render as `neutral`.
   */
  tone?: ButtonTone;
  ref?: Ref<HTMLButtonElement>;
}

/** `size="icon"` renders a square button with no visible text, so it must be named with `aria-label` or `aria-labelledby`. */
export type ButtonProps = ButtonBaseProps &
  (
    | { size?: Exclude<ButtonSize, 'icon'>; 'aria-label'?: string; 'aria-labelledby'?: string }
    | { size: 'icon'; 'aria-label': string; 'aria-labelledby'?: string }
    | { size: 'icon'; 'aria-label'?: string; 'aria-labelledby': string }
  );

function Spinner({ overlay }: { overlay?: boolean }): JSX.Element {
  return (
    <svg className={cx(styles.spinner, overlay && styles.spinnerOverlay)} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** An icon component (a function, or a forwardRef object from another icon library) or a raw <svg>. */
function isIcon(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  return node.type === 'svg' || typeof node.type === 'function' || (typeof node.type === 'object' && node.type !== null);
}

/**
 * While pending, the spinner takes the leading icon's place. Without a leading icon, the content stays in the layout
 * (transparent, still in the accessibility tree) so the button keeps its width, and the spinner sits on top, centred.
 */
function withSpinner(content: ReactNode): ReactNode {
  const items = Children.toArray(content);
  if (items.length > 0 && isIcon(items[0])) {
    return (
      <>
        <Spinner />
        {items.slice(1)}
      </>
    );
  }
  return (
    <>
      <Spinner overlay />
      <span className={styles.pendingContent}>{content}</span>
    </>
  );
}

/** Variants that have a danger style. Any other variant ignores `tone`. */
const TONED: readonly string[] = ['primary', 'outline', 'ghost'];

/*
 * Development-only warnings, once per page load each. The flags live at module level, so re-renders and further
 * instances stay quiet. `process` doesn't exist in every bundler or runtime a registry install can land in, so
 * reading it is wrapped: where it's missing, the check counts as production and nothing is logged.
 */
declare const process: { env: { NODE_ENV?: string } };
const warned = { variantDanger: false, toneIgnored: false };

function isDev(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

function warnOnce(key: keyof typeof warned, message: string): void {
  if (warned[key] || !isDev()) return;
  warned[key] = true;
  console.warn(message);
}

/**
 * A button for actions. Built on React Aria's Button, so it handles press events across mouse, touch and keyboard,
 * and `isPending` keeps it focusable while blocking presses.
 *
 * Icons go in `children` (`@strata/icons` are sized automatically). Full width: pass a className.
 */
export function Button({
  variant = 'primary',
  tone = 'neutral',
  size = 'md',
  className,
  children,
  isPending,
  ref,
  ...rest
}: ButtonProps): JSX.Element {
  const isDeprecatedDanger = variant === 'danger';
  const isToneIgnored = tone !== 'neutral' && !isDeprecatedDanger && !TONED.includes(variant);
  // The deprecated variant keeps its exact output (data-variant="danger", no data-tone) until it is removed.
  const dataTone = tone !== 'neutral' && TONED.includes(variant) ? tone : undefined;
  useEffect(() => {
    if (isDeprecatedDanger) {
      warnOnce(
        'variantDanger',
        '[@strata/react] Button: variant="danger" is deprecated and will be removed in 1.0.0. ' +
          'Use tone="danger" instead (variant="primary" tone="danger" looks the same). ' +
          'To migrate, run: npx @strata/codemods button-variant-danger-to-tone <path>',
      );
    }
    if (isToneIgnored) {
      warnOnce(
        'toneIgnored',
        `[@strata/react] Button: tone="${tone}" has no effect on variant="${variant}". ` +
          'tone works with the primary, outline and ghost variants.',
      );
    }
  }, [isDeprecatedDanger, isToneIgnored, tone, variant]);
  const local = useRef<HTMLButtonElement | null>(null);
  const setRef = useCallback(
    (el: HTMLButtonElement | null) => {
      local.current = el;
      if (typeof ref === 'function') return ref(el);
      if (ref) ref.current = el;
    },
    [ref],
  );
  // React Aria keeps a pending button focusable (aria-disabled) but doesn't pass aria-busy through, so set it here.
  useLayoutEffect(() => {
    const el = local.current;
    if (!el) return;
    if (isPending) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
  }, [isPending]);
  return (
    <RACButton
      {...rest}
      ref={setRef}
      isPending={isPending}
      data-variant={variant}
      data-tone={dataTone}
      data-size={size}
      className={composeRenderProps(className, (c) => cx(styles.root, c))}
    >
      {composeRenderProps(children, (content, { isPending: pending }) => (pending ? withSpinner(content) : content))}
    </RACButton>
  );
}
