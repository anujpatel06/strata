'use client';

import type { JSX } from 'react';
import { Link as RACLink, composeRenderProps, type LinkProps as RACLinkProps } from 'react-aria-components';
import styles from './link.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type LinkVariant = 'inline' | 'standalone';

export interface LinkProps extends RACLinkProps {
  /**
   * `inline` sits inside running text and is always underlined.
   * `standalone` stands on its own (e.g. "View all claims"), underlines on hover, and may end with an icon in `children`.
   */
  variant?: LinkVariant;
}

/**
 * A navigation link. Built on React Aria's Link: renders an `<a>` when `href` is set, works with client-side routers
 * via RouterProvider, and exposes hover/press/focus-visible states.
 */
export function Link({ variant = 'inline', className, ...rest }: LinkProps): JSX.Element {
  return <RACLink {...rest} data-variant={variant} className={composeRenderProps(className, (c) => cx(styles.root, c))} />;
}
