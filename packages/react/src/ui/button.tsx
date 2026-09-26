'use client';

import { Children, isValidElement, useCallback, useLayoutEffect, useRef, type JSX, type ReactNode, type Ref } from 'react';
import { Button as RACButton, composeRenderProps, type ButtonProps as RACButtonProps } from 'react-aria-components';
import styles from './button.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonBaseProps extends Omit<RACButtonProps, 'aria-label' | 'aria-labelledby'> {
  /** Visual style. `primary` for the one main action in a view; `danger` for destructive actions. */
  variant?: ButtonVariant;
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

/** An icon component (Tabler icons are forwardRef objects) or a raw <svg>. */
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

/**
 * A button for actions. Built on React Aria's Button, so it handles press events across mouse, touch and keyboard,
 * and `isPending` keeps it focusable while blocking presses.
 *
 * Icons go in `children` (Tabler icons are sized automatically). Full width: pass a className.
 */
export function Button({ variant = 'primary', size = 'md', className, children, isPending, ref, ...rest }: ButtonProps): JSX.Element {
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
      data-size={size}
      className={composeRenderProps(className, (c) => cx(styles.root, c))}
    >
      {composeRenderProps(children, (content, { isPending: pending }) => (pending ? withSpinner(content) : content))}
    </RACButton>
  );
}
