/**
 * Server-only: everything the homepage states as fact, read from the repo at build time.
 * No number on the homepage is typed by hand; each one traces back to a file a script writes.
 */
import { generateTheme, toCSS, type Adjustment, type BrandInput } from '@syntara/theme-engine';
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

/* ------------------------------------------------------------------ */

export interface TokensFacts {
  /** The tenant the panels quote, and its brand.json verbatim. */
  tenant: string;
  brandJson: string;
  inputCount: number;
  /** Semantic roles the engine resolves from those inputs, from the generated theme itself. */
  tokenCount: number;
  /** A few generated custom properties, so the claim is shown rather than asserted. */
  sample: string;
  /** One role, two brands: the name is the API, the value is the brand. */
  compare: string;
}

/**
 * The "brands are data" panels. Every figure is generated here at build time from the tenant files, so the
 * section cannot drift from what the engine actually produces.
 */
export const getTokensFacts = cache((): TokensFacts | undefined => {
  const tenants = getTenants();
  const vela = tenants.find((t) => t.id === 'vela') ?? tenants[0];
  const other = tenants.find((t) => t.id === 'care') ?? tenants.find((t) => t.id !== vela?.id);
  if (!vela) return undefined;

  const raw = readRepoFile('tenants', vela.id, 'brand.json');
  if (!raw) return undefined;
  const theme = generateTheme(vela.brand);

  const lines = toCSS(theme, { selector: `[data-syntara-theme="${vela.id}"]` })
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('--syntara-color-'));

  const role = '--syntara-color-action-primary-bg';
  const valueIn = (t: (typeof tenants)[number]) => {
    const css = toCSS(generateTheme(t.brand), { selector: ':root' });
    return css
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith(`${role}:`))
      ?.replace(`${role}:`, '')
      .replace(';', '')
      .trim();
  };

  const compare = other
    ? [
        `/* ${vela.name} */`,
        `${role}: ${valueIn(vela) ?? ''};`,
        '',
        `/* ${other.name} */`,
        `${role}: ${valueIn(other) ?? ''};`,
      ].join('\n')
    : '';

  return {
    tenant: vela.name,
    brandJson: raw.trim(),
    // `name` is the tenant's label, not a brand input — the six are primary, accent, neutral, shape,
    // typePair and density, which is the number the hero and BRIEF §3 both quote.
    inputCount: Object.keys(JSON.parse(raw) as Record<string, unknown>).filter((k) => k !== 'name').length,
    tokenCount: theme.summary.tokenCount,
    sample: lines.slice(0, 5).join('\n'),
    compare,
  };
});
