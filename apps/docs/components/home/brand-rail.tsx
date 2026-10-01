'use client';

/**
 * The brands rail: one card per tenant, scrolled horizontally, with arrows beside the section heading.
 *
 * The scroller itself is focusable and labelled, so it can be scrolled with the keyboard without the arrows —
 * a horizontally scrolling region that only a mouse can reach fails WCAG 2.1.1, and the arrows are a
 * convenience on top of it rather than the only way through.
 */

import { IconArrowLeft, IconArrowRight } from '@syntara/icons';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './brand-rail.module.css';

export function BrandRail({ label, children }: { label: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // A pixel of slack: fractional layout widths mean scrollLeft rarely lands exactly on 0 or max.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync]);

  const page = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    // One card plus its gap, measured from the first child rather than hard-coded.
    const first = el.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    const step = first ? first.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    /*
     * Deliberately not smooth, from here or from CSS. Measured in the browser: `scrollBy` with
     * `behavior: 'smooth'` left scrollLeft at 0 every time, with snapping set to mandatory, proximity and
     * none, and with `contain` on and off, while the same call without it moved to the next snap point.
     * Smooth scrolling was simply not happening, so the arrows do not depend on it; the snap supplies the
     * movement. This is also the behaviour someone with reduced motion would get anyway.
     */
    el.scrollBy({ left: step * dir });
  };

  return (
    <>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label={`Scroll ${label} backwards`}
        >
          <IconArrowLeft aria-hidden />
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label={`Scroll ${label} forwards`}
        >
          <IconArrowRight aria-hidden />
        </button>
      </div>
      <div ref={rail} className={styles.rail} tabIndex={0} role="group" aria-label={label}>
        {children}
      </div>
    </>
  );
}
