'use client';

import { TextField } from '@syntara/react';
import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { parseHex } from './state';
import styles from './controls.module.css';

const HEX_CHARS = /^#?[0-9a-f]*$/i;
const display = (hex: string) => hex.toUpperCase();

/**
 * A hex TextField with the native colour picker as its prefix, drawn as a swatch.
 * Six-digit hex commits on every keystroke; three-digit shorthand commits on blur or Enter, so typing
 * "#FFD400" doesn't flash #FFDD00 on the way. While the draft is invalid the last valid theme stays on screen.
 */
export function ColorControl({
  label,
  value,
  onChange,
  description,
  labelledBy,
}: {
  label: string;
  /** Id of a visible label rendered elsewhere; the field then draws no label of its own. */
  labelledBy?: string;
  /** Last valid value, lowercase #rrggbb. */
  value: string;
  onChange: (hex: string) => void;
  description?: ReactNode;
}) {
  const [draft, setDraft] = useState(display(value));
  const [blurred, setBlurred] = useState(false);

  // Follow outside changes (preset, picker, reset) unless the draft already means the same colour.
  useEffect(() => {
    setDraft((current) => (parseHex(current) === value ? current : display(value)));
    setBlurred(false);
  }, [value]);

  const parsed = parseHex(draft);
  const malformed = !HEX_CHARS.test(draft.trim()) || draft.replace('#', '').trim().length > 6;
  const invalid = !parsed && (malformed || blurred);

  const commit = (text: string, final: boolean) => {
    const hex = parseHex(text);
    const digits = text.trim().replace('#', '').length;
    if (hex && (digits === 6 || final)) onChange(hex);
  };

  const finish = () => {
    setBlurred(true);
    commit(draft, true);
    const hex = parseHex(draft);
    if (hex) setDraft(display(hex));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') finish();
    else if (event.key === 'Escape') {
      setDraft(display(value));
      setBlurred(false);
    }
  };

  return (
    <TextField
      label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      description={description}
      value={draft}
      onChange={(next) => {
        setDraft(next);
        setBlurred(false);
        commit(next, false);
      }}
      onBlur={finish}
      onKeyDown={onKeyDown}
      isInvalid={invalid}
      validationBehavior="aria"
      errorMessage="Use a hex like #3D45D6"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      maxLength={9}
      className={styles.hexField}
      prefix={
        <span className={styles.swatchWrap} style={{ backgroundColor: value }}>
          <input
            type="color"
            className={styles.picker}
            aria-label={`${label}: open colour picker`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      }
    />
  );
}
