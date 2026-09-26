'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode, type Ref } from 'react';
import {
  TextArea as RACTextArea,
  TextField as RACTextField,
  composeRenderProps,
  useLocale,
  VisuallyHidden,
  type TextFieldProps as RACTextFieldProps,
  type ValidationResult,
} from 'react-aria-components';
import { Description, FieldError, Label } from './text-field';
import styles from './text-area.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface TextAreaProps extends Omit<RACTextFieldProps, 'children' | 'type' | 'pattern' | 'inputMode'> {
  label?: ReactNode;
  description?: ReactNode;
  /** Shown when the field is invalid. A function receives React Aria's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
  /** Visible rows before typing. Also the minimum height when `autoResize` is on. */
  rows?: number;
  /** Grow with the content instead of showing a resize handle. */
  autoResize?: boolean;
  /** With `autoResize`, stop growing after this many rows and scroll instead. */
  maxRows?: number;
  /** Ref to the underlying `<textarea>`. */
  inputRef?: Ref<HTMLTextAreaElement>;
  ref?: Ref<HTMLDivElement>;
}

type Zone = 'ok' | 'near' | 'limit';

/**
 * A multi-line text input with label, help text, validation, optional auto-resize and a character counter
 * (shown when `maxLength` is set; screen readers hear it only when nearing and reaching the limit).
 */
export function TextArea({
  label,
  description,
  errorMessage,
  placeholder,
  rows = 3,
  autoResize = false,
  maxRows,
  inputRef,
  className,
  onChange,
  ...rest
}: TextAreaProps): JSX.Element {
  const { locale } = useLocale();
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      ref.current = el;
      if (typeof inputRef === 'function') inputRef(el);
      else if (inputRef) inputRef.current = el;
    },
    [inputRef],
  );

  const [uncontrolledLength, setUncontrolledLength] = useState(() => (rest.defaultValue ?? '').length);
  const length = rest.value != null ? rest.value.length : uncontrolledLength;

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el || !autoResize) return;
    el.style.blockSize = 'auto';
    const cs = getComputedStyle(el);
    const border = parseFloat(cs.borderBlockStartWidth) + parseFloat(cs.borderBlockEndWidth) || 0;
    const padding = parseFloat(cs.paddingBlockStart) + parseFloat(cs.paddingBlockEnd) || 0;
    const lineHeight = parseFloat(cs.lineHeight) || 0;
    const needed = el.scrollHeight + border;
    const max = maxRows && lineHeight ? lineHeight * maxRows + padding + border : Infinity;
    el.style.blockSize = `${Math.min(needed, max)}px`;
    el.style.overflowY = needed > max ? 'auto' : 'hidden';
  }, [autoResize, maxRows]);

  useLayoutEffect(() => {
    resize();
  }, [resize, rest.value]);

  // Counter: visual on every keystroke, announced only when crossing into "near" or "limit".
  const maxLength = rest.maxLength;
  const remaining = maxLength != null ? maxLength - length : Infinity;
  const threshold = maxLength != null ? Math.max(1, Math.ceil(maxLength * 0.1)) : 0;
  const zone: Zone = remaining <= 0 ? 'limit' : remaining <= threshold ? 'near' : 'ok';
  const previousZone = useRef<Zone>(zone);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    if (zone === previousZone.current) return;
    previousZone.current = zone;
    setAnnouncement(
      zone === 'limit' ? 'Character limit reached' : zone === 'near' ? `${remaining} ${remaining === 1 ? 'character' : 'characters'} left` : '',
    );
  }, [zone, remaining]);

  const format = (n: number) => new Intl.NumberFormat(locale).format(n);
  const showFooter = description != null || maxLength != null;

  return (
    <RACTextField
      {...rest}
      onChange={(value) => {
        setUncontrolledLength(value.length);
        onChange?.(value);
        resize();
      }}
      className={composeRenderProps(className, (c) => cx(styles.field, c))}
    >
      {label != null && <Label isRequired={rest.isRequired}>{label}</Label>}
      <RACTextArea
        ref={setRef}
        rows={rows}
        placeholder={placeholder}
        data-auto-resize={autoResize || undefined}
        className={styles.textarea}
      />
      {showFooter && (
        <div className={styles.footer}>
          {description != null && <Description>{description}</Description>}
          {maxLength != null && (
            <span className={styles.count} data-zone={zone} aria-hidden="true">
              {format(length)}/{format(maxLength)}
            </span>
          )}
        </div>
      )}
      <FieldError>{errorMessage}</FieldError>
      {maxLength != null && (
        <VisuallyHidden elementType="span" aria-live="polite" aria-atomic="true">
          {announcement}
        </VisuallyHidden>
      )}
    </RACTextField>
  );
}
