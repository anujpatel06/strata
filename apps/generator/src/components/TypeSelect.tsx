import { useId } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { TYPE_PAIRS, type TypePairId } from '@strata/theme-engine';
import styles from './TypeSelect.module.css';
import ui from './ui.module.css';

interface TypeSelectProps {
  value: TypePairId;
  onChange: (id: TypePairId) => void;
}

/** First family of a CSS font stack: "'IBM Plex Sans', system-ui" → "IBM Plex Sans". */
function firstFamily(stack: string): string {
  return (stack.split(',')[0] ?? stack).replace(/["']/g, '').trim();
}

export function TypeSelect({ value, onChange }: TypeSelectProps) {
  const id = useId();
  const specimenId = `${id}-specimen`;
  const pair = TYPE_PAIRS[value] ?? TYPE_PAIRS.precise;
  const pairs = Object.values(TYPE_PAIRS);
  return (
    <div>
      <label htmlFor={id} className={ui.label}>
        Typography
      </label>
      <span className={ui.selectWrap}>
        <select
          id={id}
          className={ui.input}
          value={value}
          aria-describedby={specimenId}
          onChange={(event) => onChange(event.target.value as TypePairId)}
        >
          {pairs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <IconChevronDown className={ui.selectChevron} size={16} stroke={2} aria-hidden="true" />
      </span>
      {pair && (
        <div className={styles.specimen}>
          <span
            className={styles.ag}
            style={{ fontFamily: pair.heading, letterSpacing: pair.headingTracking }}
            aria-hidden="true"
          >
            Ag
          </span>
          <span id={specimenId} className={styles.meta}>
            <span className={styles.family} style={{ fontFamily: pair.body }}>
              {firstFamily(pair.body)}
            </span>
            {pair.supportsArabic && <span className={styles.script}>Latin + Arabic</span>}
          </span>
          {pair.supportsArabic && (
            <span className={styles.arabic} lang="ar" dir="rtl" style={{ fontFamily: pair.body }} aria-hidden="true">
              أهلاً
            </span>
          )}
        </div>
      )}
    </div>
  );
}
