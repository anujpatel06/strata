'use client';

import { createContext, useContext, type JSX, type ReactNode, type Ref } from 'react';
import {
  RadioButton as RACRadioButton,
  RadioField as RACRadioField,
  RadioGroup as RACRadioGroup,
  composeRenderProps,
  type RadioFieldProps as RACRadioFieldProps,
  type RadioGroupProps as RACRadioGroupProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description, FieldError, Label } from './text-field';
import styles from './radio-group.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type RadioGroupVariant = 'default' | 'card';

const VariantContext = createContext<RadioGroupVariant>('default');

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children'> {
  label?: ReactNode;
  /** Help text under the group label. */
  description?: ReactNode;
  /** Shown when the group is invalid. A function receives React Aria's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  /** `card` turns each Radio into a selectable card with a title (children) and `description`. */
  variant?: RadioGroupVariant;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A labelled set of mutually exclusive options. Arrow keys move and select; Tab leaves the group.
 * `orientation` (default `vertical`) sets the layout.
 */
export function RadioGroup({
  label,
  description,
  errorMessage,
  variant = 'default',
  className,
  children,
  ...rest
}: RadioGroupProps): JSX.Element {
  return (
    <VariantContext.Provider value={variant}>
      <RACRadioGroup {...rest} data-variant={variant} className={composeRenderProps(className, (c) => cx(styles.group, c))}>
        {label != null && <Label isRequired={rest.isRequired}>{label}</Label>}
        {description != null && <Description>{description}</Description>}
        <div className={styles.items}>{children}</div>
        <FieldError>{errorMessage}</FieldError>
      </RACRadioGroup>
    </VariantContext.Provider>
  );
}

export interface RadioProps extends Omit<RACRadioFieldProps, 'children'> {
  /** The label — the card title in a `variant="card"` group. */
  children?: ReactNode;
  /** Secondary text, linked with `aria-describedby`. */
  description?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** One option in a RadioGroup. Needs a unique `value`. */
export function Radio({ children, description, className, ...rest }: RadioProps): JSX.Element {
  const variant = useContext(VariantContext);
  return (
    <RACRadioField
      {...rest}
      data-variant={variant}
      className={composeRenderProps(className, (c) => cx(styles.radio, variant === 'card' && styles.card, c))}
    >
      <RACRadioButton className={styles.button}>
        <span className={styles.circle} aria-hidden="true" />
        {children != null && <span className={styles.label}>{children}</span>}
      </RACRadioButton>
      {description != null && <Description className={styles.help}>{description}</Description>}
    </RACRadioField>
  );
}
