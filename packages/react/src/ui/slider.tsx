'use client';

import type { JSX, ReactNode, Ref } from 'react';
import {
  Slider as RACSlider,
  SliderFill as RACSliderFill,
  SliderOutput as RACSliderOutput,
  SliderThumb as RACSliderThumb,
  SliderTrack as RACSliderTrack,
  composeRenderProps,
  useLocale,
  type SliderProps as RACSliderProps,
} from 'react-aria-components';
import { Label } from './text-field';
import styles from './slider.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SliderProps<T extends number | number[] = number | number[]> extends Omit<RACSliderProps<T>, 'children'> {
  /** Visible label. Without one, pass `aria-label`. */
  label?: ReactNode;
  /** Show the formatted value (or range) next to the label. Uses `formatOptions`. */
  showOutput?: boolean;
  /** Accessible names for each thumb of a range, e.g. `['Minimum', 'Maximum']`. Combined with the label. */
  thumbLabels?: string[];
  ref?: Ref<HTMLDivElement>;
}

/**
 * A slider for one value (`defaultValue={40}`) or a range (`defaultValue={[20, 80]}`).
 * Arrow keys step, Page Up/Down step by a tenth, Home/End jump to the ends. Follows the locale's direction.
 */
export function Slider<T extends number | number[]>({
  label,
  showOutput = true,
  thumbLabels,
  className,
  ...rest
}: SliderProps<T>): JSX.Element {
  const { direction } = useLocale();
  return (
    <RACSlider {...rest} className={composeRenderProps(className, (c) => cx(styles.slider, c))}>
      {({ state }) => (
        <>
          {(label != null || showOutput) && (
            <div className={styles.header}>
              {label != null && <Label>{label}</Label>}
              {showOutput && (
                <RACSliderOutput className={styles.output}>
                  {/* The value is formatted in the locale, so render it in the locale's direction (keeps "2,000 – 8,000" in order). */}
                  {({ state: s }) => <span dir={direction}>{s.getFormattedValue()}</span>}
                </RACSliderOutput>
              )}
            </div>
          )}
          <RACSliderTrack className={styles.track}>
            {/* Thumbs are positioned from the locale's direction; the fill follows the same direction. */}
            <div className={styles.rail} dir={direction}>
              <RACSliderFill className={styles.fill} />
            </div>
            {state.values.map((_, i) => (
              <RACSliderThumb key={i} index={i} aria-label={thumbLabels?.[i]} className={styles.thumb} />
            ))}
          </RACSliderTrack>
        </>
      )}
    </RACSlider>
  );
}
