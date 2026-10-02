'use client';

import { Children, useEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode, type Ref } from 'react';
import { ToggleButton } from 'react-aria-components';
import { IconPlayerPause, IconPlayerPlay } from '@syntara/icons';
import styles from './marquee.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** Pixels per second. A loop's duration comes from its width, so a long strip moves at the same pace as a short one. */
const SPEEDS = { slow: 24, md: 40, fast: 64 } as const;

export interface MarqueeProps {
  /** Names the strip for screen readers, e.g. "Customers". Required: the region has no visible heading of its own. */
  label: string;
  /** The items. Each child becomes one list item. */
  children: ReactNode;
  /** How fast it travels. Default `md`. */
  speed?: keyof typeof SPEEDS;
  /** Travel towards the end instead of the start (rightwards in LTR, leftwards in RTL). */
  reverse?: boolean;
  /** Pause while the pointer is over the strip. Default true. */
  pauseOnHover?: boolean;
  /** Names the pause button. It is a toggle, so the name stays the same and its pressed state says whether it is paused. Default "Pause". */
  pauseLabel?: string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * A strip of items that scrolls by itself, in a loop. It meets WCAG 2.2.2 (Pause, Stop, Hide): a visible
 * pause button, a pause while anything inside has keyboard focus, and no movement at all under
 * prefers-reduced-motion, where the items simply wrap. Screen readers read one copy as a list; the
 * copies that make the loop seamless are hidden and inert.
 */
export function Marquee({
  label,
  children,
  speed = 'md',
  reverse = false,
  pauseOnHover = true,
  pauseLabel = 'Pause',
  className,
  ref,
}: MarqueeProps): JSX.Element {
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const [isPaused, setPaused] = useState(false);
  // How many times the items repeat inside one half of the track, so each half is at least as wide as the strip.
  const [repeat, setRepeat] = useState(1);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const v = viewport.current;
    const g = group.current;
    if (!v || !g || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const one = g.getBoundingClientRect().width;
      if (!one) return;
      const n = Math.max(1, Math.ceil(v.getBoundingClientRect().width / one));
      setRepeat(n);
      setDuration((one * n) / SPEEDS[speed]);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(v);
    ro.observe(g);
    return () => ro.disconnect();
  }, [speed]);

  const items = Children.toArray(children).map((child, i) => (
    <div role="listitem" className={styles.item} key={i}>
      {child}
    </div>
  ));

  // One half = the items `repeat` times. The track holds two halves and slides by exactly one, so the loop has no seam.
  const half = (hidden: boolean, key: string) => (
    <div className={styles.half} key={key} aria-hidden={hidden || undefined} inert={hidden || undefined}>
      {Array.from({ length: repeat }, (_, r) => (
        <div
          key={r}
          ref={!hidden && r === 0 ? group : undefined}
          className={styles.group}
          role={!hidden && r === 0 ? 'list' : undefined}
          aria-hidden={(!hidden && r > 0) || undefined}
          inert={(!hidden && r > 0) || undefined}
        >
          {items}
        </div>
      ))}
    </div>
  );

  return (
    <section
      ref={ref}
      aria-label={label}
      className={cx(styles.root, className)}
      data-paused={isPaused || undefined}
      data-reverse={reverse || undefined}
      data-pause-on-hover={pauseOnHover || undefined}
      data-ready={duration != null || undefined}
      style={duration != null ? ({ '--marquee-duration': `${duration}s` } as CSSProperties) : undefined}
    >
      <div ref={viewport} className={styles.viewport}>
        <div className={styles.track}>
          {half(false, 'a')}
          {half(true, 'b')}
        </div>
      </div>
      <ToggleButton
        className={styles.toggle}
        isSelected={isPaused}
        onChange={setPaused}
        aria-label={pauseLabel}
      >
        {isPaused ? <IconPlayerPlay aria-hidden /> : <IconPlayerPause aria-hidden />}
      </ToggleButton>
    </section>
  );
}
