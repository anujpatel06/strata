/**
 * The docs' honesty marker for tenant copy nobody fluent has checked yet (content.json `copyReview`, ADR-020).
 * Every surface that shows a tenant's own copy renders this in its chrome (toolbar, caption or frame), never inside
 * the tenant's screen. It reads only the data: no tenant id here, so any tenant whose copyReview is a draft gets it,
 * and it disappears on its own when the status becomes "reviewed".
 */
import { IconPencil } from '@syntara/icons';
import { Badge } from '@syntara/react';
import styles from './draft-copy-note.module.css';

/** content.json `copyReview`, as lib/tenants.ts exposes it on TenantInfo. */
export interface CopyReview {
  status: 'draft' | 'reviewed';
  language: string;
  /** English, for the docs chrome. */
  note: string;
  /** The same note in the tenant's language. */
  noteLocal?: string;
}

const STATUSES = new Set(['draft', 'reviewed']);

/**
 * Build-time check, run by the server code that hands a tenant to a page: a typo in the status ("Draft", "reviwed")
 * or an empty note would otherwise hide the marker without anyone noticing, so it fails the build instead.
 */
export function checkCopyReview(tenantId: string, review: CopyReview | undefined): CopyReview | undefined {
  if (review == null) return undefined;
  if (!STATUSES.has(review.status)) {
    throw new Error(`tenants/${tenantId}/content.json: copyReview.status must be "draft" or "reviewed", got ${JSON.stringify(review.status)}`);
  }
  if (typeof review.note !== 'string' || review.note.trim() === '') {
    throw new Error(`tenants/${tenantId}/content.json: copyReview.note is empty; the docs show it beside the copy`);
  }
  return review;
}

/** True while the copy still needs its reviewer. Anything but "reviewed" counts, so the marker fails safe. */
export function isDraftCopy(review: CopyReview | undefined): review is CopyReview {
  return review != null && review.status !== 'reviewed';
}

export interface DraftCopyNoteProps {
  review: CopyReview | undefined;
  className?: string;
}

/** A quiet chip with a pencil and the tenant's `note`, in the docs' own language. Renders nothing once reviewed. */
export function DraftCopyNote({ review, className }: DraftCopyNoteProps) {
  if (!isDraftCopy(review)) return null;
  return (
    <Badge
      tone="warning"
      variant="soft"
      size="sm"
      icon={<IconPencil />}
      lang="en"
      className={className ? `${styles.note} ${className}` : styles.note}
    >
      {review.note}
    </Badge>
  );
}
