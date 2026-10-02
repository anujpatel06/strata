'use client';

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Link as RACLink,
  VisuallyHidden,
  composeRenderProps,
  useLocale,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';
import { IconAlertCircleFilled, IconPlayerStop } from '@syntara/icons';
import styles from './streaming-response.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type StreamingStatus = 'streaming' | 'complete' | 'stopped' | 'error';

export interface StreamingResponseProps extends Omit<HTMLAttributes<HTMLElement>, 'role' | 'children'> {
  /** Where the response is. The app owns this; the component never guesses from the text. */
  status: StreamingStatus;
  /** The response so far, as plain text. This is what screen readers hear, so leave out markdown symbols and code. */
  text: string;
  /** What sighted users see, e.g. rendered markdown. Defaults to `text`. */
  children?: ReactNode;
  /** Accessible name of the response, so it can be found by article navigation. */
  label?: string;
  /** `sentences` speaks each finished sentence as it arrives; `status` speaks only the start and the end. */
  announce?: 'sentences' | 'status';
  /** Shortest gap between two spoken updates while streaming, in ms. Sentences that finish inside it are spoken together. */
  announceInterval?: number;
  /** Shown and spoken under the status line when `status="error"`. */
  errorMessage?: string;
  /** Spoken once when streaming starts. */
  startLabel?: string;
  /** Shown while streaming. */
  writingLabel?: string;
  /** Spoken when the response finishes. */
  completeLabel?: string;
  /** Shown and spoken when the response is stopped. */
  stoppedLabel?: string;
  /** Shown and spoken when the response fails. */
  errorLabel?: string;
  ref?: Ref<HTMLElement>;
}

/** Splits text into sentences for the locale (Hindi ।, Arabic ؟ …). `null` where the browser has no segmenter. */
function sentences(text: string, locale: string): string[] | null {
  const Segmenter = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (!Segmenter) return null;
  return Array.from(new Segmenter(locale, { granularity: 'sentence' }).segment(text), (s) => s.segment);
}

/**
 * A model's response as it is written, that a screen reader can follow. The visible text is not a live
 * region (that re-reads or chops it on every token); a separate hidden one speaks each finished sentence
 * once, then says how it ended. Sentence ends come from `Intl.Segmenter`, so they hold in every script.
 */
export function StreamingResponse({
  status,
  text,
  children,
  label = 'Response',
  announce = 'sentences',
  announceInterval = 1000,
  errorMessage,
  startLabel = 'Writing response',
  writingLabel = 'Writing…',
  completeLabel = 'Response complete',
  stoppedLabel = 'Stopped',
  errorLabel = "Couldn't finish",
  className,
  ...rest
}: StreamingResponseProps): JSX.Element {
  const { locale } = useLocale();
  const [spoken, setSpoken] = useState<Array<{ id: number; text: string }>>([]);
  const r = useRef({ prev: undefined as StreamingStatus | undefined, upTo: 0, pending: [] as string[], last: 0, id: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const s = r.current;
    // Additions only are announced (aria-relevant), so old entries can be dropped silently; keep a few.
    const flush = () => {
      clearTimeout(timer.current);
      if (s.pending.length === 0) return;
      const said = s.pending.join(' ');
      s.pending = [];
      s.last = Date.now();
      setSpoken((list) => [...list.slice(-2), { id: ++s.id, text: said }]);
    };
    const queueSentences = (final: boolean) => {
      if (announce !== 'sentences') return;
      if (text.length < s.upTo) s.upTo = 0; // a new response replaced the old one
      const rest = text.slice(s.upTo);
      const parts = sentences(rest, locale);
      // Without a segmenter, or for the last unfinished sentence, wait for the end.
      const done = final ? [rest] : parts && parts.length > 1 ? parts.slice(0, -1) : [];
      for (const part of done) {
        s.upTo += part.length;
        if (part.trim()) s.pending.push(part.trim());
      }
    };

    const started = status === 'streaming' && s.prev !== 'streaming';
    const ended = status !== 'streaming' && s.prev === 'streaming';
    s.prev = status;

    if (started) {
      s.upTo = 0;
      s.pending.push(startLabel);
    }
    if (status === 'streaming') queueSentences(false);
    if (ended) {
      if (status !== 'error') queueSentences(true);
      s.pending.push(status === 'complete' ? completeLabel : status === 'stopped' ? stoppedLabel : [errorLabel, errorMessage].filter(Boolean).join('. '));
      flush(); // the end is spoken at once, not held for the interval
      return;
    }
    if (s.pending.length === 0) return;
    const wait = s.last + announceInterval - Date.now();
    if (wait <= 0) flush();
    else timer.current = setTimeout(flush, wait);
    return () => clearTimeout(timer.current);
  }, [status, text, locale, announce, announceInterval, startLabel, completeLabel, stoppedLabel, errorLabel, errorMessage]);

  const line =
    status === 'streaming' ? writingLabel : status === 'stopped' ? stoppedLabel : status === 'error' ? errorLabel : null;

  return (
    <article {...rest} aria-label={label} data-status={status} className={cx(styles.root, className)}>
      <div className={styles.body} data-plain={children == null || undefined}>
        {children ?? text}
      </div>
      {line != null && (
        <div className={styles.status}>
          <span className={styles.mark} aria-hidden="true">
            {status === 'streaming' ? (
              <span className={styles.dot} />
            ) : status === 'stopped' ? (
              <IconPlayerStop />
            ) : (
              <IconAlertCircleFilled />
            )}
          </span>
          <span>
            <span className={styles.label}>{line}</span>
            {status === 'error' && errorMessage && <span className={styles.detail}>{errorMessage}</span>}
          </span>
        </div>
      )}
      <VisuallyHidden elementType="div" aria-live="polite" aria-relevant="additions" aria-atomic="false">
        {spoken.map((item) => (
          <p key={item.id}>{item.text}</p>
        ))}
      </VisuallyHidden>
    </article>
  );
}

export interface ResponseTextProps {
  /** The response so far. Usually the same string you pass to StreamingResponse's `text`. */
  text: string;
  className?: string;
}

/**
 * The visible text of a streaming response, word by word: each new word arrives in the brand's text colour and
 * settles into the body colour, and a glowing caret sits at the end while the parent is streaming. Colour and
 * opacity only, so it keeps working with reduced motion. Purely visual: StreamingResponse does the announcing.
 */
export function ResponseText({ text, className }: ResponseTextProps): JSX.Element {
  // Splitting on whitespace keeps every word whole (Arabic joining, Devanagari conjuncts), and a growing text
  // only ever appends parts, so earlier words keep their keys and never animate twice.
  const parts = text.split(/(\s+)/);
  return (
    <span className={cx(styles.text, className)}>
      {parts.map((part, i) =>
        part === '' ? null : /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={i} className={styles.word}>
            {part}
          </span>
        ),
      )}
    </span>
  );
}

export interface ResponseSourcesProps {
  /** ResponseSource links. They pop in one after another. */
  children: ReactNode;
  /** Names the list for screen readers. Default "Sources". */
  label?: string;
  className?: string;
}

/** The sources behind a response, as a row of chips. Show it once the response is complete. */
export function ResponseSources({ children, label = 'Sources', className }: ResponseSourcesProps): JSX.Element {
  return (
    <ul aria-label={label} className={cx(styles.sources, className)}>
      {Children.toArray(children).map((child, i) => (
        <li key={i} className={styles.sourceItem} style={{ '--i': i } as CSSProperties}>
          {child}
        </li>
      ))}
    </ul>
  );
}

export interface ResponseSourceProps extends Omit<RACLinkProps, 'children'> {
  /** The source's title or site name. */
  children: ReactNode;
  /** The citation number used in the text, e.g. 1 for "[1]". */
  index?: number;
}

/** One source chip: its citation number and title, as a link. */
export function ResponseSource({ children, index, className, ...props }: ResponseSourceProps): JSX.Element {
  return (
    <RACLink {...props} className={composeRenderProps(className, (c) => cx(styles.source, c))}>
      {index != null && <span className={styles.sourceIndex}>{index}</span>}
      {/* A real space, so the accessible name is "1 Changing your address", not "1Changing…". The flex gap hides it. */}
      {index != null && ' '}
      <span className={styles.sourceLabel}>{children}</span>
    </RACLink>
  );
}
