'use client';

/**
 * The /colors grid: every tenant's seven ramps in light and dark. Click a swatch to copy it as hex, as the CSS
 * variable of the semantic role that uses that step, or as oklch(). The ramps arrive pre-computed from the
 * server (color-data.ts); this file only handles hover, focus and copying.
 */

import { IconCheck } from '@strata/icons';
import { Eyebrow, ThemeScope, ToggleButton, ToggleButtonGroup, toast } from '@strata/react';
import Link from 'next/link';
import { useId, useState, type CSSProperties, type Key } from 'react';
import { Header, ListBox, ListBoxItem, ListBoxSection } from 'react-aria-components';
import { copyText } from '@/components/mdx/code-frame';
import type { ColorRamp, ColorScheme, ColorSwatch, ColorTenant, CopyFormat } from './types';
import styles from './colors-view.module.css';

const FORMATS: ReadonlyArray<{ id: CopyFormat; label: string }> = [
  { id: 'hex', label: 'Hex' },
  { id: 'var', label: 'CSS variable' },
  { id: 'oklch', label: 'OKLCH' },
];

const STEPS = Array.from({ length: 12 }, (_, i) => i + 1);

const firstKey = (keys: Set<Key>): string | undefined => {
  const [k] = keys;
  return k == null ? undefined : String(k);
};

function valueFor(swatch: ColorSwatch, format: CopyFormat): string {
  if (format === 'oklch') return swatch.oklch;
  if (format === 'var' && swatch.cssVar) return `var(${swatch.cssVar})`;
  return swatch.hex;
}

async function copySwatch(swatch: ColorSwatch, ramp: ColorRamp, scheme: ColorScheme['scheme'], format: CopyFormat) {
  const value = valueFor(swatch, format);
  const ok = await copyText(value);
  if (!ok) {
    toast({ title: 'Couldn’t copy', description: `Your browser blocked the clipboard. The value is ${value}.`, tone: 'danger' });
    return;
  }
  const where = `${ramp.label} ${swatch.step}, ${scheme}`;
  const fellBack = format === 'var' && !swatch.cssVar;
  toast({
    title: `Copied ${value}`,
    description: fellBack ? `No semantic role uses ${where}, so this is the hex value.` : where,
    tone: 'success',
  });
}

export function ColorsView({ tenants }: { tenants: ColorTenant[] }) {
  const [format, setFormat] = useState<CopyFormat>('hex');
  const formatLabelId = useId();
  return (
    <div className={styles.root}>
      <div className={styles.intro}>
      <div className={styles.toolbar}>
        <nav aria-label="Brands on this page" className={styles.jump}>
          <ul className={styles.jumpList}>
            {tenants.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={styles.jumpLink}>
                  <span className={styles.jumpDot} data-strata-theme={t.id} aria-hidden="true" />
                  {t.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.format}>
          <span id={formatLabelId} className={styles.formatLabel}>
            Copy as
          </span>
          <ToggleButtonGroup
            aria-labelledby={formatLabelId}
            size="sm"
            selectedKeys={[format]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const key = firstKey(keys);
              if (key === 'hex' || key === 'var' || key === 'oklch') setFormat(key);
            }}
          >
            {FORMATS.map((f) => (
              <ToggleButton key={f.id} id={f.id}>
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </div>

      {/* Said once for the whole page, not under every panel. */}
      <p className={styles.note}>
        Hover or focus a swatch to inspect it; click or press Enter to copy.{' '}
        <span className={styles.noteDot} aria-hidden />
        marks a step a semantic role uses, and copying it as a CSS variable gives you that role.{' '}
        <Link href="/docs/theming#semantic-roles" className={styles.noteLink}>
          How ramps map to roles
        </Link>
      </p>
      </div>

      {tenants.map((t) => (
        <TenantColors key={t.id} tenant={t} format={format} />
      ))}
    </div>
  );
}

function TenantColors({ tenant, format }: { tenant: ColorTenant; format: CopyFormat }) {
  const titleId = `${tenant.id}-title`;
  return (
    <section id={tenant.id} aria-labelledby={titleId} className={styles.tenant}>
      {/* A brand specimen, not a spec sheet: the name in the tenant's own heading face, its two brand colours as
          chips, the rest of the inputs as one quiet caption. The header is a ThemeScope in the site's scheme. */}
      <ThemeScope theme={tenant.id} data-strata-scheme="site" className={styles.tenantHeader}>
        <Eyebrow lead="rule" tone="accent">
          {tenant.description}
        </Eyebrow>
        <h2 id={titleId} className={styles.tenantTitle}>
          {tenant.name}
        </h2>
        <p className={styles.tenantCaption}>
          {tenant.facts.map((f, i) => (
            <span key={f.label} className={styles.captionItem}>
              {i > 0 && (
                <span className={styles.captionSep} aria-hidden="true">
                  ·
                </span>
              )}
              {f.swatch && <span className={styles.factSwatch} style={{ backgroundColor: f.swatch }} aria-hidden />}
              <span className="visually-hidden">{f.label}: </span>
              {f.value}
            </span>
          ))}
        </p>
      </ThemeScope>

      <div className={styles.panels}>
        {tenant.schemes.map((s) => (
          <SchemePanel key={s.scheme} tenant={tenant} scheme={s} format={format} />
        ))}
      </div>

    </section>
  );
}

function SchemePanel({ tenant, scheme, format }: { tenant: ColorTenant; scheme: ColorScheme; format: CopyFormat }) {
  const [active, setActive] = useState<{ ramp: ColorRamp; swatch: ColorSwatch } | null>(null);
  const label = scheme.scheme === 'light' ? 'Light' : 'Dark';
  const headingId = useId();
  const byKey = new Map<string, { ramp: ColorRamp; swatch: ColorSwatch }>(
    scheme.ramps.flatMap((ramp) => ramp.swatches.map((swatch) => [`${ramp.name}-${swatch.step}`, { ramp, swatch }] as const)),
  );
  return (
    <ThemeScope theme={tenant.id} scheme={scheme.scheme} className={styles.panel} aria-labelledby={headingId} role="group">
      <h3 id={headingId} className={styles.panelTitle}>
        {label}
      </h3>
      <div className={styles.table}>
        <div className={styles.stepRow} aria-hidden>
          <span className={styles.stepSpacer} />
          {STEPS.map((n) => (
            <span key={n} className={styles.stepNumber}>
              {n}
            </span>
          ))}
        </div>
        {/* One tab stop per panel: arrow keys move across and between ramps, Enter copies. */}
        <ListBox
          aria-label={`${tenant.name} ${scheme.scheme} ramps`}
          layout="grid"
          selectionMode="none"
          className={styles.swatches}
          onAction={(key) => {
            const hit = byKey.get(String(key));
            if (hit) void copySwatch(hit.swatch, hit.ramp, scheme.scheme, format);
          }}
        >
          {scheme.ramps.map((ramp) => (
            <ListBoxSection key={ramp.name} id={ramp.name} className={styles.row}>
              <Header className={styles.rampLabel}>{ramp.label}</Header>
              {ramp.swatches.map((swatch) => {
                const role = swatch.roles[0];
                const set = () => setActive({ ramp, swatch });
                return (
                  <ListBoxItem
                    key={swatch.step}
                    id={`${ramp.name}-${swatch.step}`}
                    textValue={`${ramp.label} ${swatch.step}`}
                    aria-label={`${ramp.label} ${swatch.step}, ${swatch.hex}${role ? ` (${role})` : ''}`}
                    className={styles.swatch}
                    style={{ '--swatch': swatch.hex, '--swatch-ink': swatch.ink } as CSSProperties}
                    onHoverStart={set}
                    onFocus={set}
                  >
                    {role ? <span className={styles.roleDot} aria-hidden /> : null}
                  </ListBoxItem>
                );
              })}
            </ListBoxSection>
          ))}
        </ListBox>
      </div>
      <Readout active={active} format={format} idle={`${scheme.ramps.length} ramps × ${STEPS.length} steps`} />
    </ThemeScope>
  );
}

function Readout({ active, format, idle }: { active: { ramp: ColorRamp; swatch: ColorSwatch } | null; format: CopyFormat; idle: string }) {
  if (!active) {
    return (
      <p className={styles.readout}>
        <span className={styles.readoutHint}>{idle}</span>
      </p>
    );
  }
  const { ramp, swatch } = active;
  const values: Array<[CopyFormat, string]> = [
    ['hex', swatch.hex],
    ['var', swatch.cssVar ? `var(${swatch.cssVar})` : '—'],
    ['oklch', swatch.oklch],
  ];
  return (
    <p className={styles.readout}>
      <span className={styles.readoutSwatch} style={{ '--swatch': swatch.hex } as CSSProperties} aria-hidden />
      <span className={styles.readoutName}>
        {ramp.label} {swatch.step}
      </span>
      {values.map(([f, v]) => (
        <span key={f} className={styles.readoutValue} data-selected={f === format || undefined}>
          {f === format && <IconCheck aria-hidden stroke={2} className={styles.readoutCheck} />}
          {v}
        </span>
      ))}
    </p>
  );
}
