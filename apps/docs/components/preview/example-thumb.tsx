'use client';

import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { examples } from '@/lib/examples.generated';
import styles from './example-thumb.module.css';

/** A still that throws renders as an empty stage: the card's title and description still say what the component is. */
class ThumbBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export interface ExampleThumbProps {
  /** Example file name in apps/docs/examples/<component>/, e.g. "button-demo". */
  name: string;
  /**
   * `meta.opens`: one phrase saying what the still leaves out, written along its bottom edge. The overlays portal
   * to `<body>` (ADR-012), so their examples can only show a trigger, and the caption says so rather than leaving
   * the card to look like a picture of a button.
   */
  caption?: string;
}

/**
 * A still of one example, small. The live component is laid out a little wider than the stage and scaled back to
 * fit — the same technique as the /blocks thumbnails, at a gentler ratio, because a component has to stay readable
 * where a whole page only has to be recognisable.
 *
 * The still is a picture of the page the card links to, so it is hidden from assistive tech and inert: no tab stops
 * and no pointer events inside it, and the card's title link stays the card's one target.
 *
 * It mounts only once the card is near the viewport. Fifty-three of these share this page, and an example that has
 * not mounted has not fetched its chunk. Nothing renders on the server either — the still is decorative, and every
 * card reads without it.
 */
export function ExampleThumb({ name, caption }: ExampleThumbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || near) return;
    // Two viewports of lead time, so a still has loaded by the time it is scrolled to.
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), {
      rootMargin: '200% 0px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);
  const Example = examples[name];
  return (
    <div className={styles.root}>
      <div ref={ref} className={styles.stage} aria-hidden="true" inert>
        {near && Example && (
          <div className={styles.canvas}>
            <ThumbBoundary>
              <Example />
            </ThumbBoundary>
          </div>
        )}
      </div>
      {/* Outside the stage, so it is read: the still is decorative, the caption is not. */}
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
