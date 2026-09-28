'use client';

import type { JSX, MouseEvent, ReactNode, Ref } from 'react';
import {
  FieldError as RACFieldError,
  Group as RACGroup,
  Input as RACInput,
  Label as RACLabel,
  Text as RACText,
  TextField as RACTextField,
  composeRenderProps,
  type FieldErrorProps as RACFieldErrorProps,
  type GroupProps as RACGroupProps,
  type InputProps as RACInputProps,
  type LabelProps as RACLabelProps,
  type TextFieldProps as RACTextFieldProps,
  type TextProps as RACTextProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconAlertCircle } from '@syntara/icons';
import styles from './text-field.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Field height: `md` is the control height; `sm` one 8px step smaller, `lg` two steps taller. A field and a Button of
 * the same size share height and corner radius, so they line up in a row.
 */
export type FieldSize = 'sm' | 'md' | 'lg';

/* ------------------------------------------------------------------ *
 * TextField
 * ------------------------------------------------------------------ */

export interface TextFieldProps extends Omit<RACTextFieldProps, 'children' | 'prefix'> {
  label?: ReactNode;
  description?: ReactNode;
  /** Shown when the field is invalid. A function receives React Aria's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  /** Content before the input, inside the box — e.g. a currency symbol or an icon. */
  prefix?: ReactNode;
  /** Content after the input, inside the box — e.g. a unit or an icon button. */
  suffix?: ReactNode;
  /** Ref to the underlying `<input>`. */
  inputRef?: Ref<HTMLInputElement>;
  /** Height of the box. Matches `Button` of the same size. */
  size?: FieldSize;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A single-line text input with label, help text and validation message.
 * Built on React Aria's TextField: label, description and error are linked to the input for assistive tech.
 */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  prefix,
  suffix,
  inputRef,
  size = 'md',
  className,
  ...rest
}: TextFieldProps): JSX.Element {
  const hasAdornment = prefix != null || suffix != null;
  const input = <Input placeholder={placeholder} ref={inputRef} />;
  return (
    <RACTextField {...rest} data-field-size={size} className={composeRenderProps(className, (c) => cx(styles.field, c))}>
      {label != null && <Label isRequired={rest.isRequired}>{label}</Label>}
      {hasAdornment ? (
        <FieldGroup>
          {prefix != null && <span className={styles.affix}>{prefix}</span>}
          {input}
          {suffix != null && <span className={styles.affix}>{suffix}</span>}
        </FieldGroup>
      ) : (
        input
      )}
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </RACTextField>
  );
}

/* ------------------------------------------------------------------ *
 * Primitives — generic field parts other field components compose
 * (Select, Combobox, DatePicker, TextArea, SearchField, CheckboxGroup, RadioGroup…).
 * ------------------------------------------------------------------ */

export interface LabelProps extends RACLabelProps {
  /** Shows a required marker. It is decorative (aria-hidden): the control itself carries `required`/`aria-required`. */
  isRequired?: boolean;
  ref?: Ref<HTMLLabelElement>;
}

/** Field label. Inside a React Aria field it is wired to the control automatically. */
export function Label({ isRequired, className, children, ...rest }: LabelProps): JSX.Element {
  return (
    <RACLabel {...rest} className={cx(styles.label, className)}>
      {children}
      {isRequired && (
        <span className={styles.required} aria-hidden="true">
          *
        </span>
      )}
    </RACLabel>
  );
}

export interface DescriptionProps extends Omit<RACTextProps, 'slot'> {
  ref?: Ref<HTMLElement>;
}

/** Help text under a control. Inside a React Aria field it is linked with `aria-describedby`. */
export function Description({ className, ...rest }: DescriptionProps): JSX.Element {
  return <RACText {...rest} slot="description" className={cx(styles.description, className)} />;
}

export interface FieldErrorProps extends Omit<RACFieldErrorProps, 'children'> {
  /** Message to show when the field is invalid. Defaults to the browser/validate() messages. */
  children?: ReactNode | ((validation: ValidationResult) => ReactNode);
  ref?: Ref<HTMLElement>;
}

/** Validation message with an icon (status is never colour alone). Renders nothing while the field is valid. */
export function FieldError({ children, className, ...rest }: FieldErrorProps): JSX.Element {
  return (
    <RACFieldError {...rest} className={composeRenderProps(className, (c) => cx(styles.error, c))}>
      {(validation) => {
        const content = typeof children === 'function' ? children(validation) : (children ?? validation.validationErrors.join(' '));
        if (content == null || content === '' || content === false) return null;
        return (
          <>
            <IconAlertCircle className={styles.errorIcon} aria-hidden="true" focusable="false" />
            <span>{content}</span>
          </>
        );
      }}
    </RACFieldError>
  );
}

export interface InputProps extends RACInputProps {
  ref?: Ref<HTMLInputElement>;
}

/** The bordered text input. Standalone it draws its own box; inside a FieldGroup the group draws it. */
export function Input({ className, ...rest }: InputProps): JSX.Element {
  return <RACInput {...rest} className={composeRenderProps(className, (c) => cx(styles.input, c))} />;
}

export interface FieldGroupProps extends RACGroupProps {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Draws the input box around an Input plus adornments (prefix/suffix text, icons, buttons).
 * Clicking the box or a non-interactive adornment focuses the input.
 */
export function FieldGroup({ className, onMouseDown, ...rest }: FieldGroupProps): JSX.Element {
  const focusInput = (e: MouseEvent<HTMLDivElement>) => {
    onMouseDown?.(e);
    if (e.defaultPrevented || e.button !== 0) return;
    const interactive = (e.target as HTMLElement).closest('input, textarea, button, a, select, [role="button"], [tabindex]');
    if (interactive && e.currentTarget.contains(interactive)) return;
    const input = e.currentTarget.querySelector<HTMLElement>('input, textarea');
    if (!input || input.hasAttribute('disabled')) return;
    e.preventDefault();
    input.focus();
  };
  return (
    <RACGroup {...rest} onMouseDown={focusInput} className={composeRenderProps(className, (c) => cx(styles.group, c))} />
  );
}
