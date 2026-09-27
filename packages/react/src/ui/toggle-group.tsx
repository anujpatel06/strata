'use client';

import { createContext, useContext, type JSX } from 'react';
import {
  ToggleButton as RACToggleButton,
  ToggleButtonGroup as RACToggleButtonGroup,
  SelectionIndicator,
  ToggleGroupStateContext,
  composeRenderProps,
  type ToggleButtonGroupProps as RACToggleButtonGroupProps,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components';
import styles from './toggle-group.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type ToggleSize = 'sm' | 'md';

const SizeContext = createContext<ToggleSize>('md');

export interface ToggleButtonGroupProps extends RACToggleButtonGroupProps {
  /** Height of the segmented control: `md` matches the control height, `sm` is one 8px step smaller. */
  size?: ToggleSize;
}

/**
 * A segmented control: a set of toggle buttons where one (`selectionMode="single"`, the default) or several
 * (`"multiple"`) can be on. Arrow keys move between items; Space/Enter toggles.
 */
export function ToggleButtonGroup({ size = 'md', className, ...rest }: ToggleButtonGroupProps): JSX.Element {
  return (
    <SizeContext.Provider value={size}>
      <RACToggleButtonGroup
        selectionMode="single"
        {...rest}
        data-size={size}
        className={composeRenderProps(className, (c) => cx(styles.group, c))}
      />
    </SizeContext.Provider>
  );
}

export interface ToggleButtonProps extends RACToggleButtonProps {
  /** Only for a standalone toggle; inside a group the group's size wins. */
  size?: ToggleSize;
}

/**
 * One item in a ToggleButtonGroup (give it an `id`), or a standalone on/off button (`isSelected`/`onChange`).
 * Icon-only toggles need an `aria-label`.
 */
export function ToggleButton({ size, className, children, ...rest }: ToggleButtonProps): JSX.Element {
  const inGroup = useContext(ToggleGroupStateContext) != null;
  const groupSize = useContext(SizeContext);
  const resolved = inGroup ? groupSize : (size ?? 'md');
  return (
    <RACToggleButton
      {...rest}
      data-size={resolved}
      className={composeRenderProps(className, (c) => cx(styles.item, inGroup ? styles.segment : styles.standalone, c))}
    >
      {composeRenderProps(children, (content) =>
        inGroup ? (
          <>
            {/*
             * The selected "pill". React Aria renders it only in the selected segment and, because the group is a
             * SharedElementTransition scope, animates it (CSS transition on translate/width) from the previously
             * selected segment, so selection slides instead of jumping. Decorative: empty, no role.
             */}
            <SelectionIndicator className={styles.indicator} />
            {/*
             * Selected segments turn medium weight. A plain-text label carries its text in data-label, which CSS
             * renders as an invisible zero-height copy at medium weight, reserving the width so nothing shifts.
             */}
            {typeof content === 'string' ? (
              <span className={styles.label} data-label={content}>
                {content}
              </span>
            ) : (
              content
            )}
          </>
        ) : (
          content
        ),
      )}
    </RACToggleButton>
  );
}
