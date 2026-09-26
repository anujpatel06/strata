'use client';

import type { JSX, ReactNode, Ref } from 'react';
import {
  CheckboxButton as RACCheckboxButton,
  CheckboxField as RACCheckboxField,
  CheckboxGroup as RACCheckboxGroup,
  composeRenderProps,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  type CheckboxGroupProps as RACCheckboxGroupProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import { Description, FieldError, Label } from './text-field';
import styles from './checkbox.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface CheckboxProps extends Omit<RACCheckboxFieldProps, 'children'> {
  /** The label. Without one, pass `aria-label`. */
  children?: ReactNode;
  /** Help text under the label, linked with `aria-describedby`. */
  description?: ReactNode;
  /** Standalone only (e.g. "Accept the terms" with `isRequired`); inside a CheckboxGroup the group shows errors. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  ref?: Ref<HTMLDivElement>;
}

/**
 * A checkbox with its label, optional description and validation. Supports `isIndeterminate` for "select all" rows.
 * Use inside a CheckboxGroup (give it a `value`) or on its own (`isSelected`/`onChange`).
 */
export function Checkbox({ children, description, errorMessage, className, ...rest }: CheckboxProps): JSX.Element {
  return (
    <RACCheckboxField {...rest} className={composeRenderProps(className, (c) => cx(styles.checkbox, c))}>
      <RACCheckboxButton className={styles.button}>
        {({ isSelected, isIndeterminate }) => (
          <>
            <span className={styles.box} aria-hidden="true">
              {isIndeterminate ? (
                <IconMinus strokeWidth={3} focusable="false" />
              ) : isSelected ? (
                <IconCheck strokeWidth={3} focusable="false" />
              ) : null}
            </span>
            {children != null && <span className={styles.label}>{children}</span>}
          </>
        )}
      </RACCheckboxButton>
      {description != null && <Description className={styles.help}>{description}</Description>}
      <FieldError className={styles.help}>{errorMessage}</FieldError>
    </RACCheckboxField>
  );
}

export interface CheckboxGroupProps extends Omit<RACCheckboxGroupProps, 'children'> {
  label?: ReactNode;
  /** Help text under the group label (e.g. "Select all that apply"). */
  description?: ReactNode;
  /** Shown when the group is invalid. A function receives React Aria's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  /** Stack the options (default) or lay them out in a wrapping row. */
  orientation?: 'horizontal' | 'vertical';
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** A labelled set of checkboxes whose values are collected in one array (`value` / `onChange`). */
export function CheckboxGroup({
  label,
  description,
  errorMessage,
  orientation = 'vertical',
  className,
  children,
  ...rest
}: CheckboxGroupProps): JSX.Element {
  return (
    <RACCheckboxGroup {...rest} data-orientation={orientation} className={composeRenderProps(className, (c) => cx(styles.group, c))}>
      {label != null && <Label isRequired={rest.isRequired}>{label}</Label>}
      {description != null && <Description>{description}</Description>}
      <div className={styles.items} data-orientation={orientation}>
        {children}
      </div>
      <FieldError>{errorMessage}</FieldError>
    </RACCheckboxGroup>
  );
}
