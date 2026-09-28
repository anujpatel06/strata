import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { IconAlertCircle } from '@syntara/icons';
import { parseHex } from '../url-state';
import styles from './ColorField.module.css';
import ui from './ui.module.css';

interface ColorFieldProps {
  /** Accessible name of the colour, e.g. "Primary colour". */
  name: string;
  /** Last valid value, lowercase #rrggbb. */
  value: string;
  onChange: (hex: string) => void;
}

const HEX_CHARS = /^#?[0-9a-f]*$/i;

/** "#3d45d6" → "#3D45D6" for display. */
const display = (hex: string) => hex.toUpperCase();

/**
 * Native colour picker (styled as a 40×40 swatch) + a hex text field.
 * Six-digit hex commits on every keystroke; three-digit shorthand commits on blur or Enter, so typing
 * "#FFD400" doesn't flash #FFDD00 on the way. While the draft is invalid the last valid theme stays on screen.
 */
export function ColorField({ name, value, onChange }: ColorFieldProps) {
  const id = useId();
  const hexId = `${id}-hex`;
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(display(value));
  const [blurred, setBlurred] = useState(false);

  // Follow external changes (preset switch, picker, reset) unless the draft already means the same colour.
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

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setBlurred(true);
      commit(draft, true);
      const hex = parseHex(draft);
      if (hex) setDraft(display(hex));
    } else if (event.key === 'Escape') {
      setDraft(display(value));
      setBlurred(false);
    }
  };

  return (
    <div className={styles.field}>
      <div className={styles.row}>
        <span className={styles.swatch} style={{ backgroundColor: value }}>
          <input
            className={styles.picker}
            type="color"
            aria-label={`${name}: open colour picker`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
        <div className={styles.hex}>
          <label htmlFor={hexId} className={styles.hexLabel}>
            Hex
          </label>
          <input
            id={hexId}
            className={`${ui.input} ${ui.mono} ${styles.hexInput}`}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={9}
            aria-label={`${name} hex`}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? errorId : undefined}
            value={draft}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              setBlurred(false);
              commit(next, false);
            }}
            onBlur={() => {
              setBlurred(true);
              commit(draft, true);
              const hex = parseHex(draft);
              if (hex) setDraft(display(hex));
            }}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
      {invalid && (
        <p id={errorId} className={ui.error}>
          <IconAlertCircle size={14} stroke={2} aria-hidden="true" />
          Use a hex like #3D45D6
        </p>
      )}
    </div>
  );
}
