'use client';

import * as StrataIcons from '@strata/icons';
import { IconCopy, IconSearch } from '@strata/icons';
import type { Icon } from '@strata/icons';
import {
  Button,
  EmptyState,
  SearchField,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  toast,
} from '@strata/react';
import { useMemo, useState, type CSSProperties } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { copyText } from '@/components/mdx/code-frame';
import type { IconGroup } from './icon-data';
import styles from './icons.module.css';

/** Every export of @strata/icons that is an icon (createIcon stamps `iconName`; the helper itself has none). */
const ICONS = StrataIcons as unknown as Record<string, Icon | undefined>;
const iconOf = (name: string): Icon | undefined => (ICONS[name]?.iconName ? ICONS[name] : undefined);

const SIZES = ['16', '20', '24', '32'] as const;

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface IconGalleryProps {
  groups: IconGroup[];
  /** The package's default stroke (read from create-icon.tsx). */
  defaultStroke: number;
}

/**
 * The searchable sheet: a toolbar (search, size, stroke), then every icon in its source group on a hairline grid.
 * A cell copies its import and confirms with a toast.
 */
export function IconGallery({ groups, defaultStroke }: IconGalleryProps) {
  const [query, setQuery] = useState('');
  const [size, setSize] = useState<string>('24');
  const [stroke, setStroke] = useState(defaultStroke);

  const total = groups.reduce((n, g) => n + g.names.length, 0);
  const filtered = useMemo(() => {
    const q = normalise(query);
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, names: g.names.filter((n) => normalise(n.replace(/^Icon/, '')).includes(q)) }))
      .filter((g) => g.names.length > 0);
  }, [groups, query]);
  const shown = filtered.reduce((n, g) => n + g.names.length, 0);

  const copy = async (name: string) => {
    const line = `import { ${name} } from '@strata/icons';`;
    const ok = await copyText(line);
    if (ok) {
      toast({ title: `Copied ${name}`, description: <code className={styles.toastCode}>{line}</code>, tone: 'success' });
    } else {
      toast({ title: 'Couldn’t copy', description: `Your browser blocked the clipboard. The import is: ${line}`, tone: 'danger' });
    }
  };

  const sheetStyle = { '--_size': `${size}px`, '--_stroke': stroke } as CSSProperties;

  return (
    <div className={styles.gallery}>
      <div className={styles.toolbar}>
        <SearchField
          aria-label="Search icons"
          placeholder={`Search ${total} icons…`}
          value={query}
          onChange={setQuery}
          className={styles.search}
        />
        <div className={styles.tools}>
          <ToggleButtonGroup
            aria-label="Preview size in pixels"
            size="sm"
            disallowEmptySelection
            selectedKeys={[size]}
            onSelectionChange={(keys) => {
              const [k] = keys;
              if (k != null) setSize(String(k));
            }}
          >
            {SIZES.map((s) => (
              <ToggleButton key={s} id={s} className={styles.sizeToggle}>
                {s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Slider
            label="Stroke"
            minValue={1}
            maxValue={2}
            step={0.25}
            value={stroke}
            onChange={(v) => setStroke(Array.isArray(v) ? (v[0] ?? defaultStroke) : v)}
            formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
            className={styles.stroke}
          />
        </div>
      </div>
      <p className={styles.count} role="status">
        {query ? (
          <>
            <strong>{shown}</strong> of {total} icons match “{query}”
          </>
        ) : (
          <>
            <strong>{total}</strong> icons, shown at {size}px with a {stroke.toFixed(2)} stroke. Click one to copy its
            import.
          </>
        )}
      </p>

      {shown === 0 ? (
        <EmptyState
          className={styles.empty}
          icon={<IconSearch />}
          title={`No icon called “${query}”`}
          description="Icons are named for the object, not the action: try “trash” rather than “delete”, or “pencil” rather than “edit”."
          action={
            <Button variant="outline" onPress={() => setQuery('')}>
              Clear search
            </Button>
          }
          size="md"
          level={3}
        />
      ) : (
        filtered.map((g) => (
          <section key={g.id} className={styles.group} aria-labelledby={`icons-${g.id}`}>
            <h3 id={`icons-${g.id}`} className={styles.groupTitle}>
              {g.label}
              <span className={styles.groupCount}>{g.names.length}</span>
            </h3>
            <ul className={styles.sheet} style={sheetStyle}>
              {g.names.map((name) => {
                const Glyph = iconOf(name);
                if (!Glyph) return null;
                return (
                  <li key={name} className={styles.cell}>
                    <AriaButton className={styles.cellButton} onPress={() => copy(name)} aria-describedby="icon-copy-hint">
                      <span className={styles.glyph}>
                        <Glyph />
                      </span>
                      <span className={styles.cellName}>{Glyph.iconName}</span>
                      <IconCopy aria-hidden className={styles.cellCopy} />
                    </AriaButton>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      <p id="icon-copy-hint" className="visually-hidden">
        Copies the import line
      </p>
    </div>
  );
}
