'use client';

import { IconChevronDown } from '@tabler/icons-react';
import type { JSX, ReactNode } from 'react';
import {
  Button as RACButton,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  composeRenderProps,
  type DisclosureGroupProps,
  type DisclosureProps,
} from 'react-aria-components';
import styles from './accordion.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface AccordionProps extends DisclosureGroupProps {}

/**
 * A stack of collapsible sections. One section open at a time unless `allowsMultipleExpanded`.
 * Control it with `expandedKeys` / `onExpandedChange`, or seed it with `defaultExpandedKeys`.
 */
export function Accordion({ className, ...props }: AccordionProps): JSX.Element {
  return <DisclosureGroup {...props} className={composeRenderProps(className, (c) => cx(styles.root, c))} />;
}

export interface AccordionItemProps extends Omit<DisclosureProps, 'children'> {
  /** Text of the trigger button. */
  title: ReactNode;
  children?: ReactNode;
  /** Heading level that wraps the trigger. Pick the level that fits the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export function AccordionItem({ title, children, headingLevel = 3, className, ...props }: AccordionItemProps): JSX.Element {
  return (
    <Disclosure {...props} className={composeRenderProps(className, (c) => cx(styles.item, c))}>
      <Heading level={headingLevel} className={styles.heading}>
        <RACButton slot="trigger" className={styles.trigger}>
          <span className={styles.title}>{title}</span>
          <IconChevronDown className={styles.chevron} aria-hidden="true" size="1.15em" stroke={1.75} />
        </RACButton>
      </Heading>
      <DisclosurePanel className={styles.panel}>
        <div className={styles.content}>{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
