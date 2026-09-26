'use client';

import type { JSX, ReactNode, Ref } from 'react';
import {
  Button as RACButton,
  SearchField as RACSearchField,
  composeRenderProps,
  type SearchFieldProps as RACSearchFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Description, FieldError, FieldGroup, Input, Label } from './text-field';
import styles from './search-field.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

interface SearchFieldBaseProps extends Omit<RACSearchFieldProps, 'children' | 'aria-label' | 'aria-labelledby'> {
  description?: ReactNode;
  /** Shown when the field is invalid. A function receives React Aria's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  /** Accessible name of the clear button. Defaults to React Aria's localized "Clear search". */
  clearLabel?: string;
  /** Ref to the underlying `<input>`. */
  inputRef?: Ref<HTMLInputElement>;
  ref?: Ref<HTMLDivElement>;
}

/** A search field needs a name: a visible `label`, or `aria-label` / `aria-labelledby` when the context makes it obvious. */
export type SearchFieldProps = SearchFieldBaseProps &
  (
    | { label: ReactNode; 'aria-label'?: string; 'aria-labelledby'?: string }
    | { label?: undefined; 'aria-label': string; 'aria-labelledby'?: string }
    | { label?: undefined; 'aria-label'?: string; 'aria-labelledby': string }
  );

/**
 * A search input with a leading icon and a clear button that appears once there is text.
 * Escape clears the field; Enter calls `onSubmit`.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  clearLabel,
  inputRef,
  className,
  ...rest
}: SearchFieldProps): JSX.Element {
  return (
    <RACSearchField {...rest} className={composeRenderProps(className, (c) => cx(styles.field, c))}>
      {label != null && <Label isRequired={rest.isRequired}>{label}</Label>}
      <FieldGroup className={styles.group}>
        <IconSearch className={styles.icon} aria-hidden="true" focusable="false" />
        <Input placeholder={placeholder} ref={inputRef} className={styles.input} />
        <RACButton className={styles.clear} aria-label={clearLabel}>
          <IconX aria-hidden="true" focusable="false" />
        </RACButton>
      </FieldGroup>
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </RACSearchField>
  );
}
