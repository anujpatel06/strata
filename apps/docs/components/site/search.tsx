'use client';

import { IconComponents, IconFileText, IconGitBranch, IconLayoutGrid, IconLayoutRows, IconSearch } from '@syntara/icons';
import { Button, CommandDialog, CommandItem, CommandSection, Kbd } from '@syntara/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './site-header.module.css';

export interface SearchItem {
  href: string;
  title: string;
  /** Extra words matched by the filter (description, category, keywords). */
  keywords: string;
  /** One line under the title, so results say what they are, not just what they're called. */
  description?: string;
  /** Short trailing label, e.g. a component's category. */
  meta?: string;
}

export interface SearchGroup {
  label: string;
  items: SearchItem[];
}

const normalise = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** True when `needle` appears in `hay` in order, gaps allowed ("dtpk" → "date picker"). */
function isSubsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) if (ch === needle[i] && ++i === needle.length) return true;
  return needle.length === 0;
}

/**
 * Every query word must appear in the item's text; a single word may also match the title loosely
 * (as a subsequence), so "dtpk" finds Date Picker. textValue is "title | keywords" (a separator that
 * survives normalise(); the middle dot is a Unicode diacritic and would be stripped).
 */
function fuzzyFilter(textValue: string, query: string): boolean {
  const q = normalise(query).trim();
  if (!q) return true;
  const text = normalise(textValue);
  const title = text.split(' | ')[0] ?? text;
  const words = q.split(/\s+/);
  if (words.every((w) => text.includes(w))) return true;
  return words.length === 1 && q.length >= 2 && isSubsequence(q, title.replace(/\s+/g, ''));
}

const GROUP_ICON = {
  'Getting started': IconFileText,
  Foundations: IconLayoutRows,
  Project: IconGitBranch,
  Components: IconComponents,
  Pages: IconLayoutGrid,
} as const;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

/** Header search: a button that looks like a field, ⌘K / Ctrl+K / "/" to open, and a command palette of every page. */
export function Search({ groups }: { groups: SearchGroup[] }) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [isMac, setMac] = useState(true);

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      } else if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Button variant="outline" onPress={() => setOpen(true)} className={styles.search} aria-label="Search documentation">
        <IconSearch aria-hidden className={styles.searchIcon} />
        <span className={styles.searchLabel}>Search documentation…</span>
        <Kbd className={styles.searchKbd} aria-hidden="true">
          {isMac ? '⌘K' : 'Ctrl K'}
        </Kbd>
      </Button>
      <CommandDialog
        isOpen={isOpen}
        onOpenChange={setOpen}
        placeholder="Search documentation…"
        aria-label="Search documentation"
        filter={fuzzyFilter}
        onAction={(key) => {
          setOpen(false);
          router.push(String(key));
        }}
      >
        {groups.map((group) => {
          const Icon = GROUP_ICON[group.label as keyof typeof GROUP_ICON] ?? IconFileText;
          return (
            <CommandSection key={group.label} id={group.label} title={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  id={item.href}
                  textValue={`${item.title} | ${item.keywords}`}
                  icon={<Icon size={16} />}
                  description={item.description}
                  meta={item.meta}
                >
                  {item.title}
                </CommandItem>
              ))}
            </CommandSection>
          );
        })}
      </CommandDialog>
    </>
  );
}
