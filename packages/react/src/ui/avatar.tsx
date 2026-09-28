'use client';

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
  type HTMLAttributes,
  type JSX,
  type ReactElement,
  type Ref,
} from 'react';
import { useLocale } from 'react-aria-components';
import { IconPlus } from '@syntara/icons';
import styles from './avatar.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';

/**
 * Initials tints. Each is a background/foreground pair the theme engine contrast-checks (4.5:1, text) in both
 * schemes; see packages/theme-engine/src/contrast-pairs.json. Nothing else is allowed here, so every tenant's
 * initials pass AA without a per-brand check:
 *
 *   tint      background                 foreground                  contrast-pairs.json entry
 *   brand     action.secondary.bg        action.secondary.fg         action.secondary.fg against action.secondary.bg
 *   accent    accent.subtle              accent.text                 accent.text against accent.subtle
 *   info      feedback.info.bg           feedback.info.fg            feedback.info.fg against feedback.info.bg
 *   success   feedback.success.bg        feedback.success.fg         feedback.success.fg against feedback.success.bg
 *   warning   feedback.warning.bg        feedback.warning.fg         feedback.warning.fg against feedback.warning.bg
 *   danger    feedback.danger.bg         feedback.danger.fg          feedback.danger.fg against feedback.danger.bg
 *   none      surface.sunken             text.default                text.default against surface.sunken
 *   (placeholder) surface.default        text.subtle                 text.subtle against surface.default
 *
 * Not used: text.brand on surface.selected. It looks like a natural "brand" pair but the engine doesn't check it
 * (text.brand is only checked on canvas/default/raised), so the brand tint uses the action.secondary pair instead.
 */
export type AvatarTone = 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type AvatarTint = 'auto' | 'none' | AvatarTone;
export type AvatarPlaceholder = 'add' | 'unknown';

/**
 * The pool `tint="auto"` draws from. Order is part of the hash contract: reordering recolours everyone.
 * `danger` is left out on purpose: red initials on a person read as an error. It's still available as `tint="danger"`.
 */
const AUTO_TINTS: readonly AvatarTone[] = ['brand', 'accent', 'info', 'warning', 'success'];

const GroupContext = createContext<{ size?: AvatarSize; shape?: AvatarShape } | null>(null);

/** Scripts whose letters join; initials get a zero-width non-joiner so they stay two separate letters. */
const JOINING = /[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Nko}\p{Script=Mongolian}\p{Script=Adlam}]/u;

function firstGrapheme(word: string, locale: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const first = new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(word)[Symbol.iterator]().next();
    if (!first.done) return first.value.segment;
  }
  return Array.from(word)[0] ?? '';
}

/** "Priya Raman" → "PR", "Ana María de la Cruz" → "AC", "محمد علي" → "م‌ع". Grapheme-safe (emoji, accents). */
/**
 * Arabic names often carry the definite article "ال" (e.g. "المنصوري"); the initial is the letter after it.
 * Only stripped when letters follow, so a bare "ال" is kept.
 */
const ARABIC_ARTICLE = /^\u0627\u0644(?=\p{L})/u;

export function getInitials(name: string, locale = 'en'): string {
  const words = name
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => word.replace(ARABIC_ARTICLE, ''));
  const first = words[0];
  if (!first) return '';
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const a = firstGrapheme(first, locale).toLocaleUpperCase(locale);
  const b = last ? firstGrapheme(last, locale).toLocaleUpperCase(locale) : '';
  return b && JOINING.test(a + b) ? `${a}‌${b}` : a + b;
}

/**
 * Stable tint from a name (FNV-1a over the trimmed, lower-cased code points), so a person keeps their colour
 * across renders, pages and sessions. Case and outer spaces don't matter: "priya raman " = "Priya Raman".
 */
export function getAvatarTint(name: string): AvatarTone {
  let hash = 0x811c9dc5;
  for (const ch of name.trim().toLowerCase()) {
    hash ^= ch.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return AUTO_TINTS[(hash >>> 0) % AUTO_TINTS.length]!;
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** The person's or entity's name. Used for initials, colour and the accessible name. */
  name?: string;
  /** Image URL. Falls back to initials while loading and if it fails. */
  src?: string;
  /** Accessible name. Defaults to `name`; pass "" when the name is already shown next to the avatar. */
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /**
   * Initials colour. `auto` (default) picks a tint from a hash of `name`, so the same person is always the same
   * colour; `none` is an untinted neutral; a tone fixes it. Only contrast-checked pairs are used.
   */
  tint?: AvatarTint;
  /**
   * An empty slot instead of a person: a dashed circle with "+" (`add`, e.g. "Add member") or "?" (`unknown`,
   * e.g. a member not added yet). Ignores `src` and `tint`. Still named by `alt ?? name`.
   */
  placeholder?: AvatarPlaceholder;
  ref?: Ref<HTMLSpanElement>;
}

/** A person or entity shown as a photo, or as coloured initials when there is no photo. */
export function Avatar({
  name = '',
  src,
  alt,
  size,
  shape,
  tint = 'auto',
  placeholder,
  className,
  children,
  ...rest
}: AvatarProps): JSX.Element {
  const group = useContext(GroupContext);
  const { locale } = useLocale();
  const label = alt ?? name;
  const decorative = label === '';
  // children replace whatever would show: initials, or the placeholder's "+" / "?".
  const glyph =
    children ?? (placeholder === 'add' ? <IconPlus /> : placeholder === 'unknown' ? '?' : getInitials(name, locale));

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      {...rest}
      data-size={size ?? group?.size ?? 'md'}
      data-shape={shape ?? group?.shape ?? 'circle'}
      data-tint={placeholder ? undefined : tint === 'auto' ? getAvatarTint(name) : tint}
      data-placeholder={placeholder}
      className={cx(styles.avatar, className)}
    >
      <span className={styles.fallback} aria-hidden="true">
        {glyph}
      </span>
      {src && !placeholder ? <AvatarImage key={src} src={src} /> : null}
    </span>
  );
}

/** The photo layer. Transparent until it loads (initials show through), removed if it fails. Keyed by src. */
function AvatarImage({ src }: { src: string }): JSX.Element | null {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  if (state === 'error') return null;
  return (
    <img
      className={styles.image}
      src={src}
      alt=""
      data-loaded={state === 'loaded' || undefined}
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
      ref={(img) => {
        // A cached image can finish before React attaches onLoad.
        if (img?.complete && img.naturalWidth > 0) setState('loaded');
      }}
    />
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Show at most this many avatars, then a "+N" tile. */
  max?: number;
  /** Size for every avatar in the group. */
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Accessible name for the "+N" tile. */
  moreLabel?: (count: number) => string;
  ref?: Ref<HTMLDivElement>;
}

/** Overlapping avatars, e.g. the people on a shared item. Give it an aria-label that says who they are. */
export function AvatarGroup({
  max,
  size = 'md',
  shape = 'circle',
  moreLabel = (count) => `${count} more`,
  className,
  children,
  ...rest
}: AvatarGroupProps): JSX.Element {
  const { locale, direction } = useLocale();
  const items = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const limit = max !== undefined && max >= 0 && items.length > max ? max : items.length;
  const hidden = items.length - limit;
  return (
    <GroupContext.Provider value={{ size, shape }}>
      <div role="group" {...rest} data-size={size} className={cx(styles.group, className)}>
        {items.slice(0, limit)}
        {hidden > 0 && (
          <span
            role="img"
            aria-label={moreLabel(hidden)}
            className={cx(styles.avatar, styles.more)}
            data-size={size}
            data-shape={shape}
          >
            {/* "+3" is formatted and isolated in the locale's direction, so it never shows as "3+" on RTL pages. */}
            <span className={styles.fallback} aria-hidden="true" dir={direction}>
              {new Intl.NumberFormat(locale, { signDisplay: 'always' }).format(hidden)}
            </span>
          </span>
        )}
      </div>
    </GroupContext.Provider>
  );
}
