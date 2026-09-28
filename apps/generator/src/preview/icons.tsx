/**
 * The only file in the preview that imports an icon library (Tabler — see ADR on Icon).
 * Swapping the set is a one-file change. Every icon here is decorative (aria-hidden); meaning is
 * always carried by adjacent text. Directional glyphs carry `data-directional` and are mirrored in
 * RTL by CSS, so the component never branches on direction.
 */
import {
  IconAlertTriangle,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconInfoCircle,
  IconSearch,
  type Icon as TablerIcon,
} from '@syntara/icons';
import type { Tone } from './content-types';

export interface GlyphProps {
  size?: number;
  className?: string | undefined;
}

const STROKE = 1.75;

function make(Component: TablerIcon, directional = false) {
  function Glyph({ size = 16, className }: GlyphProps) {
    return (
      <Component
        size={size}
        stroke={STROKE}
        aria-hidden="true"
        focusable="false"
        className={className}
        {...(directional ? { 'data-directional': '' } : {})}
      />
    );
  }
  return Glyph;
}

export const SearchGlyph = make(IconSearch);
export const BellGlyph = make(IconBell);
export const ChevronDownGlyph = make(IconChevronDown);
/** "Forward" chevron — mirrored in RTL. */
export const ChevronForwardGlyph = make(IconChevronRight, true);
/** Delta up / down — mirrored in RTL so time still reads forward. */
export const TrendUpGlyph = make(IconArrowUpRight, true);
export const TrendDownGlyph = make(IconArrowDownRight, true);
/** Ledger direction: money in / money out — mirrored in RTL. */
export const MoneyInGlyph = make(IconArrowDownLeft, true);
export const MoneyOutGlyph = make(IconArrowUpRight, true);

const TONE_ICONS: Record<Tone, TablerIcon> = {
  success: IconCircleCheck,
  warning: IconClock,
  danger: IconCircleX,
  info: IconInfoCircle,
};

const ALERT_ICONS: Record<Tone, TablerIcon> = {
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  danger: IconCircleX,
  info: IconInfoCircle,
};

/** Status badge glyph: shape differs per tone so status never relies on colour alone. */
export function ToneGlyph({ tone, size = 14, className }: GlyphProps & { tone: Tone }) {
  const Component = TONE_ICONS[tone];
  return <Component size={size} stroke={STROKE} aria-hidden="true" focusable="false" className={className} />;
}

/** Alert banner glyph. */
export function AlertGlyph({ tone, size = 20, className }: GlyphProps & { tone: Tone }) {
  const Component = ALERT_ICONS[tone];
  return <Component size={size} stroke={STROKE} aria-hidden="true" focusable="false" className={className} />;
}
