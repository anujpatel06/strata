'use client';

import type { HTMLAttributes, JSX, Ref } from 'react';
import styles from './kbd.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

/** A keyboard key or shortcut, rendered as <kbd>. */
export function Kbd({ className, ...rest }: KbdProps): JSX.Element {
  return <kbd {...rest} className={cx(styles.kbd, className)} />;
}

export interface KbdGroupProps extends HTMLAttributes<HTMLElement> {
  ref?: Ref<HTMLElement>;
}

/** A key combination: <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>. Nested <kbd> is the HTML idiom for this. */
export function KbdGroup({ className, ...rest }: KbdGroupProps): JSX.Element {
  return <kbd {...rest} className={cx(styles.group, className)} />;
}
