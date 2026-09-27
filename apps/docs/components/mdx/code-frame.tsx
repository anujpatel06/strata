'use client';

import { IconCheck, IconCopy } from '@strata/icons';
import { Button, Tooltip, TooltipTrigger } from '@strata/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './code.module.css';

/** Copies text to the clipboard; resolves false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ getText, label = 'Copy code', className }: { getText: () => string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const t = setTimeout(() => setState('idle'), 1600);
    return () => clearTimeout(t);
  }, [state]);
  const tip = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label;
  return (
    <>
    <TooltipTrigger delay={300}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={tip}
        className={[styles.copy, className].filter(Boolean).join(' ')}
        onPress={async () => setState((await copyText(getText())) ? 'copied' : 'failed')}
      >
        {state === 'copied' ? <IconCheck aria-hidden stroke={2} /> : <IconCopy aria-hidden />}
      </Button>
      <Tooltip>{tip}</Tooltip>
    </TooltipTrigger>
    <span className="visually-hidden" role="status">
      {state === 'copied' ? 'Copied to clipboard' : state === 'failed' ? 'Copy failed' : ''}
    </span>
    </>
  );
}

export interface CodeFrameProps {
  title?: ReactNode;
  icon?: ReactNode;
  /** Long code starts collapsed to a fixed height with an Expand button. */
  collapsible?: boolean;
  /** Frame without its own border/radius (inside tabs or previews). */
  flush?: boolean;
  children: ReactNode;
}

/** Chrome around a highlighted <pre>: optional title bar, copy button, expand/collapse for long files. */
export function CodeFrame({ title, icon, collapsible, flush, children }: CodeFrameProps) {
  const body = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const getText = () => body.current?.querySelector('pre')?.textContent ?? '';
  const collapsed = collapsible && !expanded;
  return (
    <figure className={styles.frame} data-flush={flush || undefined} data-titled={title ? '' : undefined}>
      {title ? (
        <figcaption className={styles.titleBar}>
          {icon}
          <span className={styles.title}>{title}</span>
          <CopyButton getText={getText} />
        </figcaption>
      ) : (
        <CopyButton getText={getText} className={styles.copyFloating} />
      )}
      <div ref={body} className={styles.body} data-collapsed={collapsed || undefined}>
        {children}
      </div>
      {collapsible && (
        <div className={styles.expandBar} data-collapsed={collapsed || undefined}>
          <Button variant="secondary" size="sm" onPress={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      )}
    </figure>
  );
}
