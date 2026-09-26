'use client';

import type { HTMLAttributes, JSX, Ref } from 'react';
import styles from './card.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `default` = raised surface with border and shadow, `outline` = border only, `ghost` = no chrome. */
  variant?: 'default' | 'outline' | 'ghost';
  ref?: Ref<HTMLDivElement>;
}

/** A surface that groups related content and actions. Compose with CardHeader, CardContent and CardFooter. */
export function Card({ variant = 'default', className, ...rest }: CardProps): JSX.Element {
  return <div {...rest} data-variant={variant} className={cx(styles.card, className)} />;
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
  ref?: Ref<HTMLDivElement>;
}

export function CardContent({ className, ...rest }: CardContentProps): JSX.Element {
  return <div {...rest} className={cx(styles.content, className)} />;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Draws a hairline above the footer. */
  divider?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function CardFooter({ divider = false, className, ...rest }: CardFooterProps): JSX.Element {
  return <div {...rest} data-divider={divider || undefined} className={cx(styles.footer, className)} />;
}
