import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { slugify, textOf } from '@/lib/slug';
import styles from './prose.module.css';

export function H2({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h2 id={id ?? slugify(textOf(children))} className={styles.h2}>
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <h3 id={id ?? slugify(textOf(children))} className={styles.h3}>
      {children}
    </h3>
  );
}

export function H4({ children }: { children?: ReactNode }) {
  return <h4 className={styles.h4}>{children}</h4>;
}

export function P({ className, ...props }: ComponentProps<'p'>) {
  return <p {...props} className={className ? `${styles.p} ${className}` : styles.p} />;
}

export function A({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <Link href={href} className={styles.a} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={styles.a} rel="noreferrer" {...rest}>
      {children}
    </a>
  );
}

export function InlineCode(props: ComponentProps<'code'>) {
  return <code {...props} className={styles.code} />;
}

export function Ul(props: ComponentProps<'ul'>) {
  return <ul {...props} className={styles.ul} />;
}

export function Ol(props: ComponentProps<'ol'>) {
  return <ol {...props} className={styles.ol} />;
}

export function Li(props: ComponentProps<'li'>) {
  return <li {...props} className={styles.li} />;
}

export function Blockquote(props: ComponentProps<'blockquote'>) {
  return <blockquote {...props} className={styles.blockquote} />;
}

export function Hr() {
  return <hr className={styles.hr} />;
}

export function Strong(props: ComponentProps<'strong'>) {
  return <strong {...props} className={styles.strong} />;
}

/** Tables scroll sideways inside their own box on narrow screens (focusable so keyboard users can scroll). */
export function Table({ children, ...rest }: ComponentProps<'table'>) {
  return (
    <div className={styles.tableWrap} tabIndex={0} role="region" aria-label={rest['aria-label'] ?? 'Table'}>
      <table {...rest} className={styles.table}>
        {children}
      </table>
    </div>
  );
}

/** Numbered steps: every ### heading inside gets a counter on the start rail. */
export function Steps({ children }: { children?: ReactNode }) {
  return <div className={styles.steps}>{children}</div>;
}
