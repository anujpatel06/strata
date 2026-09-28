/**
 * Server-only: everything the homepage states as fact, read from the repo at build time.
 * No number on the homepage is typed by hand; each one traces back to a file a script writes.
 */
import { generateTheme, type Adjustment, type BrandInput } from '@syntara/theme-engine';
import { cache } from 'react';
import { checkCopyReview, type CopyReview } from '@/components/page/draft-copy-note';
import { getAllMeta } from '@/lib/meta';
import { readRepoFile } from '@/lib/repo';
import { getHouseBrand, getTenants } from '@/lib/tenants';

/** packages/theme-engine/reports/fuzz-report.json — written by `pnpm test:themes`. */
export interface FuzzSummary {
  command: string;
  seed: number;
  themes: number;
  checksPerTheme: number;
  totalChecks: number;
  passed: number;
  failed: number;
  passRatePercent: number;
  medianMs: number;
  adjustments: { min: number; median: number; max: number };
}

export const getFuzzSummary = cache((): FuzzSummary | undefined => {
  const raw = readRepoFile('packages', 'theme-engine', 'reports', 'fuzz-report.json');
  if (!raw) return undefined;
  const r = JSON.parse(raw) as {
    command: string;
    seed: number;
    themes: number;
    checksPerTheme: number;
    totalChecks: number;
    passed: number;
    failed: number;
    passRatePercent: number;
    generationMs: { median: number };
    adjustmentsPerTheme: { min: number; median: number; max: number };
  };
  return {
    command: r.command,
    seed: r.seed,
    themes: r.themes,
    checksPerTheme: r.checksPerTheme,
    totalChecks: r.totalChecks,
    passed: r.passed,
    failed: r.failed,
    passRatePercent: r.passRatePercent,
    medianMs: r.generationMs.median,
    adjustments: r.adjustmentsPerTheme,
  };
});

/** "v0.2" from the first release heading in the changelog, and the number of component meta files. */
export const getReleaseInfo = cache((): { version?: string; components: number } => {
  const changelog = readRepoFile('apps', 'docs', 'content', 'docs', 'changelog.mdx') ?? '';
  const version = /^##\s+(v\d+(?:\.\d+)*)/m.exec(changelog)?.[1];
  return { version, components: getAllMeta().length };
});

/** A tenant as the homepage's client components need it: serialisable, no file access. */
export interface HomeTenant {
  id: string;
  name: string;
  brand: BrandInput;
  locale: string;
  dir: 'ltr' | 'rtl';
  industry: string;
}

/** Vela, Harbor, Qamar (the reference tenants, in brief order), then the house brand. */
export const getHomeTenants = cache((): HomeTenant[] => {
  const tenants: HomeTenant[] = getTenants().map((t) => ({
    id: t.id,
    name: t.name,
    brand: t.brand,
    locale: t.locale,
    dir: t.dir,
    industry: t.product.industry,
  }));
  tenants.push({ id: 'house', name: 'House', brand: getHouseBrand(), locale: 'en-US', dir: 'ltr', industry: 'This site' });
  return tenants;
});

/** Tenant copy for the "one system" cards: the Overview screen's content from tenants/<id>/content.json. */
export interface TenantOverview {
  id: string;
  name: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  product: string;
  industry: string;
  user: string;
  greeting: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  alert?: { tone: 'info' | 'success' | 'warning' | 'danger'; title: string };
  stats: Array<{ label: string; value: string; delta?: number; deltaLabel?: string; positiveIsGood: boolean }>;
  shape: BrandInput['shape'];
  density: BrandInput['density'];
  typePair: BrandInput['typePair'];
  /** content.json `copyReview`: while it's a draft, the card's caption says so. */
  copyReview?: CopyReview;
}

interface ContentJson {
  locale?: string;
  currency?: string;
  product?: { name?: string; industry?: string };
  user?: { name?: string };
  overview?: {
    greeting?: string;
    subtitle?: string;
    primaryAction?: string;
    secondaryAction?: string;
    alert?: { tone?: string; title?: string };
    stats?: Array<{ label: string; value: number; format?: string; delta?: number; deltaLabel?: string; positiveIsGood?: boolean }>;
  };
}

const TONES = new Set(['info', 'success', 'warning', 'danger']);

export const getTenantOverviews = cache((): TenantOverview[] => {
  const out: TenantOverview[] = [];
  for (const t of getTenants()) {
    const raw = readRepoFile('tenants', t.id, 'content.json');
    if (!raw) continue;
    const c = JSON.parse(raw) as ContentJson;
    const o = c.overview ?? {};
    const locale = c.locale ?? t.locale;
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: c.currency ?? 'USD', maximumFractionDigits: 0 });
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    out.push({
      id: t.id,
      name: t.name,
      locale,
      dir: t.dir,
      product: c.product?.name ?? t.name,
      industry: c.product?.industry ?? '',
      user: c.user?.name ?? '',
      greeting: o.greeting ?? '',
      subtitle: o.subtitle ?? '',
      primaryAction: o.primaryAction ?? '',
      secondaryAction: o.secondaryAction ?? '',
      alert:
        o.alert?.title && TONES.has(o.alert.tone ?? '')
          ? { tone: o.alert.tone as 'info' | 'success' | 'warning' | 'danger', title: o.alert.title }
          : undefined,
      stats: (o.stats ?? []).slice(0, 2).map((s) => ({
        label: s.label,
        value: s.format === 'currency' ? money.format(s.value) : plain.format(s.value),
        delta: s.delta,
        deltaLabel: s.deltaLabel,
        positiveIsGood: s.positiveIsGood ?? true,
      })),
      shape: t.brand.shape,
      density: t.brand.density,
      typePair: t.brand.typePair,
      ...(t.copyReview ? { copyReview: checkCopyReview(t.id, t.copyReview) } : {}),
    });
  }
  return out;
});

/**
 * One real adjustment the solver makes for Qamar, generated at build time: the light-mode button label
 * (Qamar's saffron is too light for white text). Falls back to the first adjustment for any other brand.
 */
export interface SolverQuote {
  tenant: string;
  adjustment: Adjustment;
  /** The surface the adjusted colour sits on, e.g. the button fill. */
  againstHex?: string;
}

export const getSolverQuote = cache((): SolverQuote | undefined => {
  const tenant = getTenants().find((t) => t.id === 'qamar') ?? getTenants()[0];
  if (!tenant) return undefined;
  const theme = generateTheme(tenant.brand);
  const adjustment =
    theme.adjustments.find((a) => a.scheme === 'light' && a.role === 'action.primary.fg') ?? theme.adjustments[0];
  if (!adjustment) return undefined;
  const against = adjustment.against?.[0];
  return {
    tenant: tenant.name,
    adjustment,
    againstHex: against ? theme.schemes[adjustment.scheme].roles[against].hex : undefined,
  };
});
