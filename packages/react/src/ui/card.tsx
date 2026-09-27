'use client';

import type { HTMLAttributes, JSX, Ref } from 'react';
import styles from './card.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `default` = raised surface with border and shadow, `outline` = border only, `ghost` = no chrome.
   * `feature` = a promo/hero card: a deep brand glow from the top-start corner, a rim-light edge and the brand halo.
   * Its text stays on checked pairs (see card.module.css for the numbers). Use one per view.
   */
  variant?: 'default' | 'outline' | 'ghost' | 'feature';
  /**
   * Rim light: the 1px edge catches light at the top-left and fades, like glass. Off by default, so existing screens
   * don't change. Always on for `variant="feature"`.
   */
  rim?: boolean;
  /** A faint, decorative star field (CSS dots, hidden from assistive tech). Only drawn on `variant="feature"`. */
  stars?: boolean;
  /**
   * For cards that open something. Put one link in the CardTitle: it stretches over the whole card, so
   * the card lifts under the pointer, the whole surface is clickable and the focus ring goes round the card.
   * Other buttons and links inside stay separately clickable above it.
   */
  interactive?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** A surface that groups related content and actions. Compose with CardHeader, CardContent and CardFooter. */
export function Card({
  variant = 'default',
  interactive = false,
  rim = false,
  stars = false,
  className,
  ...rest
}: CardProps): JSX.Element {
  return (
    <div
      {...rest}
      data-variant={variant}
      data-interactive={interactive || undefined}
      data-rim={rim || variant === 'feature' || undefined}
      data-stars={(stars && variant === 'feature') || undefined}
      className={cx(styles.card, className)}
    />
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Draws a hairline under the header. */
  divider?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/** Title, description and an optional CardAction at the inline end. */
export function CardHeader({ divider = false, className, ...rest }: CardHeaderProps): JSX.Element {
  return <div {...rest} data-divider={divider || undefined} className={cx(styles.header, className)} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level. Pick the one that fits the page outline. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  ref?: Ref<HTMLHeadingElement>;
}

export function CardTitle({ level = 3, className, ...rest }: CardTitleProps): JSX.Element {
  const Heading = `h${level}` as const;
  return <Heading {...rest} className={cx(styles.title, className)} />;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

export function CardDescription({ className, ...rest }: CardDescriptionProps): JSX.Element {
  return <p {...rest} className={cx(styles.description, className)} />;
}

export interface CardActionProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/** Sits at the top inline-end corner of CardHeader, e.g. a menu button or a link. */
export function CardAction({ className, ...rest }: CardActionProps): JSX.Element {
  return <div {...rest} className={cx(styles.action, className)} />;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `default` = content sits on the card. `inset` = a pale inner surface (sunken fill, hairline edge, a corner
   * concentric with the card) for a table, list or code block that should read as one object inside the card.
   * Inside it, `--strata-card-inset` is halved, so nested parts that align to the card inset (DataTable edge
   * cells, for one) tighten to fit.
   */
  variant?: 'default' | 'inset';
  ref?: Ref<HTMLDivElement>;
}

export function CardContent({ variant = 'default', className, ...rest }: CardContentProps): JSX.Element {
  return (
    <div {...rest} data-variant={variant === 'default' ? undefined : variant} className={cx(styles.content, className)} />
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Draws a hairline above the footer. */
  divider?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function CardFooter({ divider = false, className, ...rest }: CardFooterProps): JSX.Element {
  return <div {...rest} data-divider={divider || undefined} className={cx(styles.footer, className)} />;
}
