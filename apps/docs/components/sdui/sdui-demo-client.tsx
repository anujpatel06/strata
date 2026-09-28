'use client';

/**
 * The live server-driven UI demo: a screen document on one side, what <StrataScreen> draws from it on the other,
 * and below them what the validator, the renderer (onIssue) and the host (onAction) saw.
 *
 * The toolbar is the component preview's (components/preview): same controls, same classes. Tenant, scheme,
 * direction and density belong to the client, so they live on the ThemeScope around the screen, never in the JSON.
 */
import {
  IconAlertTriangle,
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
  IconCircleCheck,
  IconCircleX,
  IconDeviceMobile,
  IconMoon,
  IconRefresh,
  IconSun,
  IconTextDirectionLtr,
  IconTextDirectionRtl,
} from '@strata/icons';
import {
  Badge,
  Button,
  EmptyState,
  Select,
  SelectItem,
  TextArea,
  ThemeScope,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  type BadgeProps,
} from '@strata/react';
import { validateScreen, type ValidationResult } from '@strata/sdui';
import { StrataScreen, type Action, type ActionContext, type Issue, type IssueCode } from '@strata/sdui/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { useSiteScheme } from '@/components/home/use-site-scheme';
import preview from '@/components/preview/preview.module.css';
import { formatJson } from './format-json';
import { PRESETS } from './presets';
import styles from './sdui-demo.module.css';

export interface DemoExample {
  /** File name in packages/sdui/examples without .json. */
  id: string;
  /** The document's screen.title. */
  title: string;
  doc: Record<string, unknown>;
}

export interface DemoTenant {
  id: string;
  name: string;
  density: 'comfortable' | 'compact';
  dir: 'ltr' | 'rtl';
  locale: string;
}

type Scheme = 'light' | 'dark';
type Dir = 'ltr' | 'rtl';
type Density = 'comfortable' | 'compact';
type Parsed = { ok: true; doc: unknown } | { ok: false; message: string };

/** How long typing pauses before the document is parsed, checked and drawn again. */
const SETTLE_MS = 350;

function parse(text: string): Parsed {
  try {
    return { ok: true, doc: JSON.parse(text) as unknown };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function firstKey(keys: Set<Key>): string | undefined {
  const [k] = keys;
  return k == null ? undefined : String(k);
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The renderer's issue codes by what happened to the screen. */
const FALLBACK_CODES = new Set<IssueCode>(['invalid-document', 'unsupported-version']);
const REPLACED_CODES = new Set<IssueCode>(['unknown-component', 'unknown-action', 'render-error', 'too-deep']);
const issueTone = (code: IssueCode): BadgeProps['tone'] =>
  FALLBACK_CODES.has(code) ? 'danger' : REPLACED_CODES.has(code) ? 'warning' : 'neutral';

function IconToggle({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <TooltipTrigger delay={500}>
      <ToggleButton id={id} aria-label={label} className={preview.iconToggle}>
        {children}
      </ToggleButton>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

/** What the host app draws when a document can't be drawn. The host's own UI, not part of the document. */
function HostFallback() {
  return (
    <EmptyState
      size="sm"
      level={2}
      icon={<IconDeviceMobile aria-hidden />}
      title="This screen isn’t available"
      description="Update the app to see it."
    />
  );
}

function Pointer({ path }: { path: string }) {
  return <code className={styles.pointer}>{path === '' ? '(document)' : path}</code>;
}

export function SduiDemoClient({ examples, tenants }: { examples: DemoExample[]; tenants: DemoTenant[] }) {
  const ids = {
    editor: useId(),
    screen: useId(),
    breakIt: useId(),
    validator: useId(),
    renderer: useId(),
    host: useId(),
  };
  const formatted = useMemo(() => new Map(examples.map((e) => [e.id, formatJson(e.doc)])), [examples]);
  const first = examples[0];
  const initialText = (first && formatted.get(first.id)?.text) ?? '';

  // The document
  const [exampleId, setExampleId] = useState(first?.id ?? '');
  const [text, setText] = useState(initialText);
  const [committed, setCommitted] = useState(initialText);
  const [note, setNote] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [lastAction, setLastAction] = useState<{ action: Action; context: ActionContext } | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // The client
  const siteScheme = useSiteScheme();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? 'house');
  const [scheme, setScheme] = useState<Scheme | undefined>();
  const [dir, setDir] = useState<Dir>('ltr');
  const [density, setDensity] = useState<Density | undefined>();
  const tenant = tenants.find((t) => t.id === tenantId) ?? tenants[0];
  const effectiveScheme = scheme ?? siteScheme;
  const effectiveDensity = density ?? tenant?.density ?? 'comfortable';
  // The tenant's own locale when the direction is the tenant's own; the preview's defaults when it's flipped.
  const locale = tenant && dir === tenant.dir ? tenant.locale : dir === 'rtl' ? 'ar-AE' : 'en-US';

  const parsed = useMemo(() => parse(committed), [committed]);
  const validation = useMemo<ValidationResult | null>(() => (parsed.ok ? validateScreen(parsed.doc) : null), [parsed]);
  const fellBack = !parsed.ok || issues.some((i) => FALLBACK_CODES.has(i.code));

  /** Replace the whole document at once (an example, a preset, a reset): no waiting for typing to settle. */
  const load = (next: string, nextNote: string | null, line: number | null) => {
    setText(next);
    if (next !== committed) {
      setCommitted(next);
      setIssues([]);
    }
    setNote(nextNote);
    setScrollTo(line);
  };

  // Typing: parse, check and draw once the text has been still for a moment.
  useEffect(() => {
    if (text === committed) return;
    const timer = setTimeout(() => {
      setCommitted(text);
      setIssues([]);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [text, committed]);

  // After a preset, show the change in the editor without moving focus.
  useEffect(() => {
    const el = editorRef.current;
    if (scrollTo == null || !el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.scrollTop = Math.max(0, (scrollTo - 2) * lineHeight);
    el.scrollLeft = 0;
  }, [scrollTo, committed]);

  const onIssue = useCallback((issue: Issue) => {
    setIssues((list) =>
      list.some((i) => i.code === issue.code && i.path === issue.path && i.message === issue.message) ? list : [...list, issue],
    );
  }, []);

  const onAction = useCallback((action: Action, context: ActionContext) => {
    setLastAction({ action, context });
    const message = `The host received ${action.type} ${action.type === 'navigate' ? action.href : action.name}.`;
    // The same action twice is still news: change the text so the live region speaks again.
    setAnnouncement((previous) => (previous === message ? `${message} ` : message));
  }, []);

  // Announce the outcome of an edit once it settles. Not on first load: nothing has changed yet.
  const errorCount = validation?.errors.length ?? 0;
  const summary = !parsed.ok
    ? 'The text isn’t valid JSON. The host’s fallback is shown.'
    : `Validator: ${errorCount === 0 ? 'valid' : plural(errorCount, 'error')}. Renderer: ${
        fellBack ? 'drew the host’s fallback' : issues.length ? `drew the screen, ${plural(issues.length, 'issue')}` : 'drew the screen'
      }.`;
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = setTimeout(() => setAnnouncement(summary), 150);
    return () => clearTimeout(timer);
  }, [summary]);

  const example = examples.find((e) => e.id === exampleId) ?? first;
  const setEditor = useCallback((el: HTMLTextAreaElement | null) => {
    editorRef.current = el;
    if (!el) return;
    // Code, not prose: no spellcheck squiggles, no autocorrected quotes.
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('autocorrect', 'off');
  }, []);

  const editorError = !parsed.ok
    ? `Not valid JSON: ${parsed.message}`
    : errorCount > 0
      ? `The validator found ${plural(errorCount, 'error')}. They’re listed under the screen.`
      : undefined;

  return (
    <div className={`${preview.frame} ${styles.root}`}>
      <div className={preview.bar}>
        <div className={styles.start}>
        <Select
          aria-label="Example document"
          size="sm"
          selectedKey={exampleId}
          onSelectionChange={(key) => {
            if (key == null) return;
            const id = String(key);
            setExampleId(id);
            setLastAction(null);
            load(formatted.get(id)?.text ?? '', null, 0);
          }}
          className={styles.picker}
        >
          {examples.map((e) => (
            <SelectItem key={e.id} id={e.id}>
              {e.title}
            </SelectItem>
          ))}
        </Select>
        <TooltipTrigger delay={400}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset to the example"
            className={styles.reset}
            onPress={() => {
              setLastAction(null);
              load(formatted.get(exampleId)?.text ?? '', null, 0);
            }}
          >
            <IconRefresh aria-hidden />
          </Button>
          <Tooltip>Reset to the example</Tooltip>
        </TooltipTrigger>
        </div>
        <div className={preview.controls}>
          <div className={preview.tenantPicker}>
            <ToggleButtonGroup
              aria-label="Tenant"
              size="sm"
              disallowEmptySelection
              selectedKeys={[tenantId]}
              onSelectionChange={(keys) => {
                const next = tenants.find((t) => t.id === firstKey(keys));
                if (!next) return;
                setTenantId(next.id);
              }}
              className={preview.dots}
            >
              {tenants.map((t) => (
                <TooltipTrigger key={t.id} delay={400}>
                  <ToggleButton id={t.id} aria-label={t.name} className={preview.dotToggle}>
                    <span className={preview.dot} data-strata-theme={t.id} aria-hidden="true" />
                  </ToggleButton>
                  <Tooltip>{t.name}</Tooltip>
                </TooltipTrigger>
              ))}
            </ToggleButtonGroup>
            <span className={preview.tenantName} aria-hidden="true">
              {tenant?.name}
            </span>
          </div>
          <span className={`${preview.divider} ${preview.wideOnly}`} aria-hidden="true" />
          <ToggleButtonGroup
            aria-label="Colour scheme"
            size="sm"
            disallowEmptySelection
            selectedKeys={[effectiveScheme]}
            onSelectionChange={(keys) => setScheme(firstKey(keys) as Scheme)}
            className={preview.group}
          >
            <IconToggle id="light" label="Light">
              <IconSun aria-hidden />
            </IconToggle>
            <IconToggle id="dark" label="Dark">
              <IconMoon aria-hidden />
            </IconToggle>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            aria-label="Direction"
            size="sm"
            disallowEmptySelection
            selectedKeys={[dir]}
            onSelectionChange={(keys) => setDir(firstKey(keys) as Dir)}
            className={preview.group}
          >
            <IconToggle id="ltr" label="Left to right">
              <IconTextDirectionLtr aria-hidden />
            </IconToggle>
            <IconToggle id="rtl" label="Right to left">
              <IconTextDirectionRtl aria-hidden />
            </IconToggle>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            aria-label="Density"
            size="sm"
            disallowEmptySelection
            selectedKeys={[effectiveDensity]}
            onSelectionChange={(keys) => setDensity(firstKey(keys) as Density)}
            className={`${preview.group} ${preview.wideOnly}`}
          >
            <IconToggle id="comfortable" label="Comfortable">
              <IconBaselineDensityMedium aria-hidden />
            </IconToggle>
            <IconToggle id="compact" label="Compact">
              <IconBaselineDensitySmall aria-hidden />
            </IconToggle>
          </ToggleButtonGroup>
        </div>
      </div>

      <div className={styles.breakRow}>
        <span id={ids.breakIt} className={styles.breakLabel}>
          Break it
        </span>
        <div role="group" aria-labelledby={ids.breakIt} className={styles.presets}>
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              onPress={() => {
                if (!example) return;
                const result = p.apply(example.doc);
                const out = formatJson(result.doc);
                setLastAction(null);
                load(out.text, result.note, out.lines.get(result.pointer) ?? 0);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      {note && <p className={styles.note}>{note}</p>}

      <div className={styles.panes}>
        <div className={styles.editorPane}>
          <TextArea
            label="Screen document"
            description="JSON, as a server would send it. The screen redraws when you stop typing."
            value={text}
            onChange={(value) => {
              setText(value);
              setNote(null);
            }}
            isInvalid={editorError != null}
            errorMessage={editorError}
            rows={20}
            inputRef={setEditor}
            className={styles.editor}
          />
        </div>
        <div className={styles.screenPane}>
          <div className={styles.paneHead}>
            <span id={ids.screen} className={styles.paneLabel}>
              Rendered screen
            </span>
            <span className={styles.client}>
              {[tenant?.name, locale, effectiveScheme, effectiveDensity].filter(Boolean).join(' · ')}
            </span>
          </div>
          <ThemeScope
            theme={tenant?.id}
            data-strata-scheme={scheme ?? 'site'}
            density={density}
            locale={locale}
            className={styles.stage}
            role="region"
            aria-labelledby={ids.screen}
          >
            <div className={styles.screen}>
              {parsed.ok ? (
                <StrataScreen document={parsed.doc} onAction={onAction} onIssue={onIssue} fallback={<HostFallback />} />
              ) : (
                <HostFallback />
              )}
            </div>
          </ThemeScope>
        </div>
      </div>

      <div className={styles.results}>
        <section aria-labelledby={ids.validator} className={styles.result}>
          <h3 id={ids.validator} className={styles.resultTitle}>
            Validator
          </h3>
          <p className={styles.api}>
            Strict, on the server · <code>validateScreen</code>
          </p>
          {!parsed.ok ? (
            <>
              <Status tone="danger" icon={<IconCircleX aria-hidden />}>
                Not JSON
              </Status>
              <p className={styles.message}>{parsed.message}</p>
            </>
          ) : errorCount === 0 ? (
            <Status tone="success" icon={<IconCircleCheck aria-hidden />}>
              Valid
            </Status>
          ) : (
            <>
              <Status tone="danger" icon={<IconCircleX aria-hidden />}>
                {plural(errorCount, 'error')}
              </Status>
              <ul className={styles.list}>
                {validation?.errors.map((e, i) => (
                  <li key={`${e.path}-${i}`} className={styles.item}>
                    <span className={styles.itemHead}>
                      <Pointer path={e.path} />
                      {e.rule && (
                        <Badge size="sm" variant="outline">
                          {e.rule}
                        </Badge>
                      )}
                    </span>
                    <span className={styles.message}>{e.message}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section aria-labelledby={ids.renderer} className={styles.result}>
          <h3 id={ids.renderer} className={styles.resultTitle}>
            Renderer
          </h3>
          <p className={styles.api}>
            Tolerant, on the client · <code>onIssue</code>
          </p>
          {!parsed.ok ? (
            <Status tone="neutral" icon={<IconDeviceMobile aria-hidden />}>
              Not called
            </Status>
          ) : fellBack ? (
            <Status tone="danger" icon={<IconCircleX aria-hidden />}>
              Drew the host’s fallback
            </Status>
          ) : issues.length ? (
            <Status tone="warning" icon={<IconAlertTriangle aria-hidden />}>
              Drew the screen, {plural(issues.length, 'issue')}
            </Status>
          ) : (
            <Status tone="success" icon={<IconCircleCheck aria-hidden />}>
              Drew the screen
            </Status>
          )}
          {!parsed.ok ? (
            <p className={styles.message}>The host couldn’t parse the response, so it drew its fallback without calling the renderer.</p>
          ) : (
            issues.length > 0 && (
              <ul className={styles.list}>
                {issues.map((issue, i) => (
                  <li key={`${issue.code}-${issue.path}-${i}`} className={styles.item}>
                    <span className={styles.itemHead}>
                      <Badge size="sm" tone={issueTone(issue.code)}>
                        {issue.code}
                      </Badge>
                      <Pointer path={issue.path} />
                    </span>
                    <span className={styles.message}>{issue.message}</span>
                  </li>
                ))}
              </ul>
            )
          )}
        </section>

        <section aria-labelledby={ids.host} className={styles.result}>
          <h3 id={ids.host} className={styles.resultTitle}>
            Host
          </h3>
          <p className={styles.api}>
            The app decides what to do · <code>onAction</code>
          </p>
          {lastAction ? (
            <dl className={styles.action}>
              <dt>Type</dt>
              <dd>
                <code>{lastAction.action.type}</code>
              </dd>
              {lastAction.action.type === 'navigate' ? (
                <>
                  <dt>href</dt>
                  <dd>
                    <code>{lastAction.action.href}</code>
                  </dd>
                </>
              ) : (
                <>
                  <dt>Name</dt>
                  <dd>
                    <code>{lastAction.action.name}</code>
                  </dd>
                  {lastAction.action.payload && (
                    <>
                      <dt>Payload</dt>
                      <dd>
                        <code>{JSON.stringify(lastAction.action.payload)}</code>
                      </dd>
                    </>
                  )}
                </>
              )}
              <dt>From</dt>
              <dd>
                {lastAction.context.nodeType}
                {lastAction.context.nodeId && (
                  <>
                    {' '}
                    <code>{lastAction.context.nodeId}</code>
                  </>
                )}
              </dd>
            </dl>
          ) : (
            <p className={styles.message}>Nothing yet. Press a button or link in the screen. Links don’t navigate: the host gets them.</p>
          )}
        </section>
      </div>

      <div role="status" className="visually-hidden">
        {announcement}
      </div>
    </div>
  );
}

function Status({ tone, icon, children }: { tone: BadgeProps['tone']; icon: ReactNode; children: ReactNode }) {
  return (
    <p className={styles.status}>
      <Badge tone={tone} variant="soft" icon={icon}>
        {children}
      </Badge>
    </p>
  );
}
