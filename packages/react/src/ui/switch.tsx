'use client';

import type { JSX, ReactNode, Ref } from 'react';
import {
  SwitchButton as RACSwitchButton,
  SwitchField as RACSwitchField,
  composeRenderProps,
  type SwitchFieldProps as RACSwitchFieldProps,
} from 'react-aria-components';
import { Description } from './text-field';
import styles from './switch.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SwitchProps extends Omit<RACSwitchFieldProps, 'children'> {
  /** The label, shown on the inline-end side of the track. Without one, pass `aria-label`. */
  children?: ReactNode;
  /** Help text under the label, linked with `aria-describedby`. */
  description?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * An on/off control for settings that apply immediately. Space toggles.
 * Use a Checkbox instead when the choice is submitted with a form.
 */
export function Switch({ children, description, className, ...rest }: SwitchProps): JSX.Element {
  return (
    <RACSwitchField {...rest} className={composeRenderProps(className, (c) => cx(styles.switch, c))}>
      <RACSwitchButton className={styles.button}>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        {children != null && <span className={styles.label}>{children}</span>}
      </RACSwitchButton>
      {description != null && <Description className={styles.help}>{description}</Description>}
    </RACSwitchField>
  );
}
