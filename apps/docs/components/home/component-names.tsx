'use client';

/**
 * "Component names": labels the live demo with the Syntara component each part is, so the screen argues for
 * itself rather than just looking nice.
 *
 * The labels are not a hand-kept list. Each component's CSS Modules class carries its file name, so an
 * instance can be found in the DOM by its class, and the names it is allowed to use come from meta.json — the
 * same source the docs pages read. A new component appears here the day it ships; a renamed one cannot go
 * stale, because a name that no longer exists in meta simply stops matching.
 *
 * Only the outermost instance of each component is labelled. A Card inside a Card, or the Buttons inside a
 * DataTable, would otherwise bury the screen in chips.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './component-names.module.css';

/*
 * In the published package the scoped name is `syntara-<file>__<class>` (packages/react/vite.config.ts), but
 * the docs app compiles the same CSS Modules itself and emits `<file>-module__<hash>__<class>`. This reads the
 * docs form, and only names that are real components — the caller passes the list from meta.json — so the
 * docs' own modules (showcase-grid, cards, eyebrow) are not mistaken for library components.
 */
const CLASS = /^([a-z0-9-]+)-module__/;

/** `area-chart` → `AreaChart`, which is what the component is called in an import. */
function title(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function componentOf(el: Element, known: ReadonlyMap<string, string>): string | undefined {
  for (const c of el.classList) {
    const m = CLASS.exec(c);
    if (m?.[1] && known.has(m[1])) return m[1];
  }
  return undefined;
}

interface Label {
  name: string;
  top: number;
  left: number;
}

export function ComponentNames({
  targetRef,
  enabled,
  components,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  enabled: boolean;
  /** slug → title from packages/react/meta. Used only as the allow-list; the label is the import name. */
  components: Readonly<Record<string, string>>;
}) {
  const known = useMemo(() => new Map(Object.entries(components)), [components]);
  const [labels, setLabels] = useState<Label[]>([]);
  const frame = useRef<number | undefined>(undefined);

  const measure = useCallback(() => {
    const root = targetRef.current;
    if (!root || !enabled) {
      setLabels([]);
      return;
    }
    const box = root.getBoundingClientRect();
    const seen = new Map<string, Element>();
    for (const el of root.querySelectorAll('*')) {
      const name = componentOf(el, known);
      if (!name) continue;
      const first = seen.get(name);
      // Keep the outermost: if we already have one and it contains this, skip; if this contains it, replace.
      if (first && first.contains(el)) continue;
      if (first && !el.contains(first)) continue;
      seen.set(name, el);
    }
    const next: Label[] = [];
    for (const [name, el] of seen) {
      const r = el.getBoundingClientRect();
      // Skip anything collapsed or scrolled out of the frame; a label with nothing under it reads as a bug.
      if (r.width < 24 || r.height < 12) continue;
      if (r.bottom < box.top || r.top > box.bottom) continue;
      // The import name, not meta's human title: "ToggleGroup" is what you would type, "Toggle Group" is not.
      next.push({ name: title(name), top: r.top - box.top, left: r.left - box.left });
    }
    setLabels(next);
  }, [targetRef, enabled, known]);

  useEffect(() => {
    if (!enabled) {
      setLabels([]);
      return;
    }
    const schedule = () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    schedule();
    const root = targetRef.current;
    const ro = new ResizeObserver(schedule);
    if (root) ro.observe(root);
    window.addEventListener('resize', schedule);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [enabled, measure, targetRef]);

  if (!enabled || labels.length === 0) return null;
  return (
    // Decorative: the names are already in the markup as real components, and a screen-reader user gets no
    // benefit from hearing "Card" twice. The toggle that controls this is the accessible affordance.
    <div aria-hidden className={styles.layer}>
      {labels.map((l) => (
        <span key={`${l.name}-${l.top}-${l.left}`} className={styles.label} style={{ top: l.top, insetInlineStart: l.left }}>
          {l.name}
        </span>
      ))}
    </div>
  );
}
