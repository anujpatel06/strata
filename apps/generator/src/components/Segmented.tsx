import { Fragment, useId, type ReactNode } from 'react';
import ui from './ui.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  /** Group name, shown as the fieldset legend. */
  legend: string;
  /** Hide the legend visually (it is still announced). */
  legendHidden?: boolean;
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  size?: 'md' | 'sm';
  className?: string;
}

/**
 * Segmented control built from real radio inputs: arrow keys, form semantics and
 * screen-reader announcements come from the platform, not from custom key handling.
 */
export function Segmented<T extends string>({
  legend,
  legendHidden = false,
  options,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className={[ui.fieldset, className].filter(Boolean).join(' ')}>
      <legend className={legendHidden ? ui.srOnly : ui.label}>{legend}</legend>
      <div className={[ui.segmented, size === 'sm' ? ui.segmentSmall : ''].join(' ')}>
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <Fragment key={option.value}>
              <input
                id={id}
                className={ui.segmentInput}
                type="radio"
                name={name}
                value={option.value}
                checked={option.value === value}
                onChange={() => onChange(option.value)}
              />
              <label htmlFor={id} className={ui.segment}>
                {option.icon}
                <span>{option.label}</span>
              </label>
            </Fragment>
          );
        })}
      </div>
    </fieldset>
  );
}
