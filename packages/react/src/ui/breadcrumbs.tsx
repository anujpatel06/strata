'use client';

import { IconChevronRight, IconDots } from '@strata/icons';
import { Children, cloneElement, isValidElement, useState, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Breadcrumb as RACBreadcrumb,
  Breadcrumbs as RACBreadcrumbs,
  Button as RACButton,
  Link as RACLink,
  composeRenderProps,
  type BreadcrumbProps as RACBreadcrumbProps,
  type BreadcrumbsProps as RACBreadcrumbsProps,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';
import styles from './breadcrumbs.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface BreadcrumbsProps<T extends object> extends Omit<RACBreadcrumbsProps<T>, 'children'> {
  children?: RACBreadcrumbsProps<T>['children'];
  /**
   * Collapse a long trail: when there are more items than this, the first item and the last
   * `maxItems - 1` items stay visible and the rest fold into an ellipsis button that expands the trail.
   * Applies to static `<Breadcrumb>` children.
   */
  maxItems?: number;
  /**
   * Accessible name of the landmark (and the list). Landmarks must be unique on a page: if a page shows more
   * than one trail, name each ("Claim breadcrumbs", "Folder breadcrumbs").
   */
  'aria-label'?: string;
  /** Accessible name of the ellipsis button. */
  expandLabel?: string;
}

/**
 * A trail of links to the current page. Renders `<nav aria-label="Breadcrumbs"><ol>…</ol></nav>`;
 * the last item is the current page (`aria-current="page"`).
 */
export function Breadcrumbs<T extends object>({
  className,
  children,
  maxItems,
  'aria-label': ariaLabel = 'Breadcrumbs',
  expandLabel = 'Show all breadcrumbs',
  ...props
}: BreadcrumbsProps<T>): JSX.Element {
  // 'expanded-by-user': the ellipsis was pressed, so focus moves to the first item it revealed.
  const [state, setState] = useState<'collapsed' | 'expanded-by-user'>('collapsed');

  let content = children;
  const items = typeof children === 'function' ? null : (Children.toArray(children).filter(isValidElement) as ReactElement[]);
  const collapsible = items != null && maxItems != null && maxItems >= 2 && items.length > maxItems;
  if (items && collapsible && state === 'collapsed') {
    const tail = items.slice(items.length - (maxItems - 1));
    content = [
      items[0],
      <RACBreadcrumb key="strata-breadcrumbs-ellipsis" id="strata-breadcrumbs-ellipsis" className={styles.item}>
        <RACButton
          className={styles.ellipsis}
          aria-label={expandLabel}
          onPress={() => setState('expanded-by-user')}
        >
          <IconDots aria-hidden="true" size="1.15em" />
        </RACButton>
        <Separator />
      </RACBreadcrumb>,
      ...tail,
    ];
  } else if (items && collapsible) {
    // The ellipsis button unmounted when pressed; the first item it revealed takes focus as it mounts.
    // Items the ellipsis revealed get a class that fades them in (see .revealed).
    const revealedEnd = items.length - (maxItems - 1);
    content = items.map((item, i) => {
      if (i < 1 || i >= revealedEnd) return item;
      const el = item as ReactElement<BreadcrumbProps>;
      const own = el.props.className;
      return cloneElement(el, {
        autoFocus: i === 1 || undefined,
        className: typeof own === 'function' ? (rp) => cx(styles.revealed, own(rp)) : cx(styles.revealed, own),
      });
    });
  }

  return (
    <nav aria-label={ariaLabel} className={styles.nav}>
      {/* React Aria labels the list too; give it the same name so the two never disagree. */}
      <RACBreadcrumbs {...props} aria-label={ariaLabel} className={cx(styles.list, className)}>
        {content as RACBreadcrumbsProps<T>['children']}
      </RACBreadcrumbs>
    </nav>
  );
}

function Separator(): JSX.Element {
  return (
    <span className={styles.separator} aria-hidden="true">
      <IconChevronRight size="1em" />
    </span>
  );
}

export interface BreadcrumbProps extends Omit<RACBreadcrumbProps, 'children'> {
  /** Link target. Omit on the current page. */
  href?: RACLinkProps['href'];
  /** Extra props for the inner link (e.g. `routerOptions`, `target`). */
  linkProps?: Omit<RACLinkProps, 'href' | 'children' | 'className'>;
  /** Focus the link when it mounts. */
  autoFocus?: boolean;
  children?: ReactNode;
}

/** One item in the trail. The last item is the current page and is not a link. */
export function Breadcrumb({ href, linkProps, autoFocus, children, className, ...props }: BreadcrumbProps): JSX.Element {
  return (
    <RACBreadcrumb {...props} className={composeRenderProps(className, (c) => cx(styles.item, c))}>
      {({ isCurrent }) => (
        <>
          <RACLink {...linkProps} autoFocus={autoFocus} href={isCurrent ? undefined : href} className={styles.link}>
            {children}
          </RACLink>
          {!isCurrent && <Separator />}
        </>
      )}
    </RACBreadcrumb>
  );
}
