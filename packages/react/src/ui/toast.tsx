'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type JSX,
  type ReactNode,
} from 'react';
import {
  Button as AriaButton,
  I18nProvider,
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
  isRTL,
  useLocale,
  type QueuedToast,
  type ToastRegionProps as AriaToastRegionProps,
} from 'react-aria-components';
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconInfoCircleFilled,
  IconSealCheckFilled,
  IconX,
} from '@syntara/icons';
import { Button } from './button';
import styles from './toast.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ *
 * Queue + imperative API
 * ------------------------------------------------------------------ */

export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface ToastContent {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** Replaces the tone's status shape, e.g. `<IconCopy />` for a copy confirmation. Decorative: the title carries the meaning. Coloured by the tone. */
  icon?: ReactNode;
  /**
   * One short action, e.g. Undo. Pressing it runs `onAction` and closes the toast. Its weight follows the tone:
   * a high-contrast button (`contrast`) for `danger` and `warning`, because something needs you, and a quiet neutral
   * one (`outline`) otherwise. Not `secondary`: in some brands that's brand-tinted and competes with the status colour.
   */
  action?: { label: string; onAction: () => void };
}

export interface ToastOptions {
  /**
   * Auto-dismiss after this many ms. Default 5000, or no timeout when the toast has an action
   * (keyboard users need time to reach it). `null` keeps the toast until dismissed.
   */
  timeout?: number | null;
  /** Called after the toast is removed, by the user, a timeout or toast.dismiss(). */
  onClose?: () => void;
}

const DEFAULT_TIMEOUT = 5000;

const motionAllowed = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

/**
 * React Aria's ToastQueue, plus an exit phase: close() marks a rendered toast as exiting, the toast
 * plays its exit animation, then finishClose() removes it. Unrendered toasts, or reduced motion,
 * close immediately. Timers, pause-on-hover and focus management stay React Aria's.
 */
class SyntaraToastQueue extends AriaToastQueue<ToastContent> {
  #exiting: ReadonlySet<string> = new Set();
  #rendered = new Set<string>();
  #listeners = new Set<() => void>();

  override close(key: string): void {
    if (this.#exiting.has(key)) return;
    if (!this.#rendered.has(key) || !motionAllowed()) {
      super.close(key);
      return;
    }
    this.#exiting = new Set(this.#exiting).add(key);
    this.#emit();
    // Safety net in case animationend never arrives (hidden tab, animation overridden).
    setTimeout(() => this.finishClose(key), 2000);
  }

  finishClose(key: string): void {
    if (!this.#exiting.has(key)) return;
    const next = new Set(this.#exiting);
    next.delete(key);
    this.#exiting = next;
    super.close(key);
    this.#emit();
  }

  override clear(): void {
    this.#exiting = new Set();
    super.clear();
    this.#emit();
  }

  markRendered(key: string, rendered: boolean): void {
    if (rendered) this.#rendered.add(key);
    else this.#rendered.delete(key);
  }

  subscribeExiting = (fn: () => void): (() => void) => {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  };

  getExiting = (): ReadonlySet<string> => this.#exiting;

  #emit(): void {
    for (const fn of this.#listeners) fn();
  }
}

const queue = new SyntaraToastQueue({ maxVisibleToasts: 3 });

function showToast(content: ToastContent | string, options: ToastOptions = {}): string {
  const data = typeof content === 'string' ? { title: content } : content;
  const timeout = options.timeout === undefined ? (data.action ? undefined : DEFAULT_TIMEOUT) : (options.timeout ?? undefined);
  return queue.add(data, { timeout, onClose: options.onClose });
}

/**
 * Shows a toast and returns its key. Needs one <ToastRegion /> mounted inside your ThemeScope.
 *   toast({ title: 'Saved', tone: 'success' })
 *   const key = toast({ title: 'Uploading…' }, { timeout: null }); toast.dismiss(key);
 */
export const toast = Object.assign(showToast, {
  /** Closes one toast, or every toast when called without a key. */
  dismiss(key?: string): void {
    if (key === undefined) queue.clear();
    else queue.close(key);
  },
});

/* ------------------------------------------------------------------ *
 * Region
 * ------------------------------------------------------------------ */

export type ToastPlacement = 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

export interface ToastRegionProps
  extends Omit<AriaToastRegionProps<ToastContent>, 'queue' | 'children' | 'className' | 'style'> {
  /** Corner or edge of the viewport the stack grows from. */
  placement?: ToastPlacement;
  className?: string;
}

/** The theme and direction of wherever <ToastRegion /> is mounted, forwarded to its portalled element. */
interface Scope {
  theme?: string;
  scheme?: string;
  density?: string;
  lang?: string;
  dir?: string;
}

const SCOPE_ATTRS = ['data-syntara-theme', 'data-syntara-scheme', 'data-syntara-density', 'dir', 'lang'];

function readScope(anchor: Element): Scope {
  // Each attribute on its own: a single-tenant app themes :root and scopes only the scheme.
  const read = (name: string) => anchor.closest(`[${name}]`)?.getAttribute(name) ?? undefined;
  return {
    theme: read('data-syntara-theme'),
    scheme: read('data-syntara-scheme'),
    density: read('data-syntara-density'),
    lang: anchor.closest('[lang]')?.getAttribute('lang') || undefined,
    dir: anchor.closest('[dir]')?.getAttribute('dir') ?? undefined,
  };
}

const sameScope = (a: Scope, b: Scope) =>
  a.theme === b.theme && a.scheme === b.scheme && a.density === b.density && a.lang === b.lang && a.dir === b.dir;

/* Only one mounted region renders the queue; extra <ToastRegion />s (e.g. one per docs example) wait their turn. */
let owner: symbol | null = null;
const ownerListeners = new Set<() => void>();

interface Layout {
  /** Position among live toasts, newest = 0. */
  index: number;
  /** Sum of the heights of newer live toasts, px. */
  offset: number;
}

interface RegionContextValue {
  layout: Map<string, Layout>;
  count: number;
  frontHeight?: number;
  heights: Record<string, number>;
  exiting: ReadonlySet<string>;
  reportHeight: (key: string, height: number) => void;
}

const RegionContext = createContext<RegionContextValue | null>(null);

/**
 * Where toasts appear. Mount one inside your app's ThemeScope (e.g. next to your layout's
 * children). Toasts portal to <body>, so the region copies the theme, scheme, density, lang and dir
 * of the spot where it is mounted onto the portalled element — they look and read like the page.
 */
export function ToastRegion({ placement = 'bottom-end', className, ...rest }: ToastRegionProps): JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [id] = useState(() => Symbol('ToastRegion'));
  const [isOwner, setIsOwner] = useState(false);
  const [scope, setScope] = useState<Scope>({});
  const [heights, setHeights] = useState<Record<string, number>>({});
  const outer = useLocale();

  const visible = useSyncExternalStore(
    (fn) => queue.subscribe(fn),
    () => queue.visibleToasts,
    () => queue.visibleToasts,
  );
  const exiting = useSyncExternalStore(queue.subscribeExiting, queue.getExiting, queue.getExiting);

  useEffect(() => {
    const claim = () => {
      if (owner === null) owner = id;
      setIsOwner(owner === id);
    };
    claim();
    ownerListeners.add(claim);
    return () => {
      ownerListeners.delete(claim);
      if (owner === id) {
        owner = null;
        for (const fn of ownerListeners) fn();
      }
    };
  }, [id]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const update = () => {
      const next = readScope(anchor);
      setScope((prev) => (sameScope(prev, next) ? prev : next));
    };
    update();
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: SCOPE_ATTRS });
    return () => observer.disconnect();
  }, []);

  // Forget heights of toasts that are gone.
  useEffect(() => {
    setHeights((prev) => {
      const keys = Object.keys(prev).filter((k) => visible.some((t) => t.key === k));
      return keys.length === Object.keys(prev).length ? prev : Object.fromEntries(keys.map((k) => [k, prev[k] ?? 0]));
    });
  }, [visible]);

  // Stack geometry: exiting toasts keep the slot they had, so the rest can close the gap while they fade.
  const lastLayout = useRef(new Map<string, Layout>());
  const layout = new Map<string, Layout>();
  let offset = 0;
  let index = 0;
  for (const t of visible) {
    if (exiting.has(t.key)) continue;
    layout.set(t.key, { index, offset });
    offset += heights[t.key] ?? 0;
    index += 1;
  }
  for (const t of visible) {
    const previous = lastLayout.current.get(t.key);
    if (exiting.has(t.key)) layout.set(t.key, previous ?? { index: 0, offset: 0 });
  }
  lastLayout.current = layout;
  const front = visible.find((t) => !exiting.has(t.key));

  const reportHeight = useCallback(
    (key: string, height: number) => setHeights((prev) => (prev[key] === height ? prev : { ...prev, [key]: height })),
    [],
  );
  const context: RegionContextValue = {
    layout,
    count: visible.length,
    frontHeight: front ? heights[front.key] : undefined,
    heights,
    exiting,
    reportHeight,
  };

  // A page can be RTL (dir + lang on the ThemeScope) while React Aria's locale is still LTR, e.g. no
  // I18nProvider. React Aria sets `dir` on the region from its locale, so when the page's own lang
  // explains its direction, use that lang for the region (this also localises "Close").
  const pageRTL = scope.dir === 'rtl' ? true : scope.dir === 'ltr' ? false : undefined;
  const fixLocale =
    pageRTL !== undefined && pageRTL !== isRTL(outer.locale) && scope.lang && isRTL(scope.lang) === pageRTL
      ? scope.lang
      : undefined;

  const region = (
    <AriaToastRegion
      {...rest}
      queue={queue}
      lang={scope.lang}
      data-syntara-theme={scope.theme}
      data-syntara-scheme={scope.scheme}
      data-syntara-density={scope.density}
      data-placement={placement}
      className={cx(styles.region, className)}
    >
      {({ toast: item }) => <ToastItem toast={item} />}
    </AriaToastRegion>
  );

  return (
    <>
      <span ref={anchorRef} hidden data-syntara-toast-anchor="" />
      {isOwner && (
        <RegionContext.Provider value={context}>
          {fixLocale ? <I18nProvider locale={fixLocale}>{region}</I18nProvider> : region}
        </RegionContext.Provider>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Toast
 * ------------------------------------------------------------------ */

/*
 * Filled status shapes (Anuj's reference): each tone has its own shape, so tone never relies on colour alone.
 * Danger is the rounded triangle, as in the reference; warning takes the circled "!" so the two stay distinct.
 * CSS colours the shape feedback.<tone>.fg and knocks the glyph out in feedback.<tone>.bg (see the proof in
 * test/toast.test.tsx: shape ≥ 3:1 on the toast surface, glyph ≥ 4.5:1 on the shape).
 */
const TONE_ICON: Record<ToastTone, typeof IconInfoCircleFilled> = {
  // Neutral keeps the same icon | text | action rhythm: the info shape in text.subtle, glyph knocked out in the face.
  neutral: IconInfoCircleFilled,
  info: IconInfoCircleFilled,
  success: IconSealCheckFilled,
  warning: IconAlertCircleFilled,
  danger: IconAlertTriangleFilled,
};

function ToastItem({ toast: item }: { toast: QueuedToast<ToastContent> }): JSX.Element {
  const region = useContext(RegionContext);
  const innerRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const { key, content } = item;
  const tone = content.tone ?? 'neutral';
  const ToneIcon = TONE_ICON[tone];
  const isExiting = region?.exiting.has(key) ?? false;
  const slot = region?.layout.get(key) ?? { index: 0, offset: 0 };
  const height = region?.heights[key];
  const reportHeight = region?.reportHeight;

  useEffect(() => {
    queue.markRendered(key, true);
    return () => queue.markRendered(key, false);
  }, [key]);

  // Measure the natural (untransformed, unclipped) height so the stack can lay out real offsets.
  useLayoutEffect(() => {
    const inner = innerRef.current;
    const outer = toastRef.current;
    if (!inner || !outer || !reportHeight) return;
    const measure = () => reportHeight(key, inner.offsetHeight + (outer.offsetHeight - outer.clientHeight));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [key, reportHeight]);

  const style = {
    '--_index': slot.index,
    '--_offset': `${slot.offset}px`,
    '--_front-h': region?.frontHeight !== undefined ? `${region.frontHeight}px` : undefined,
    '--_self-h': height !== undefined ? `${height}px` : undefined,
    zIndex: (region?.count ?? 1) - slot.index,
  } as CSSProperties;

  return (
    <AriaToast
      toast={item}
      ref={toastRef}
      style={style}
      data-tone={tone}
      data-front={slot.index === 0 && !isExiting ? '' : undefined}
      data-exiting={isExiting || undefined}
      onAnimationEnd={(e) => {
        if (isExiting && e.target === e.currentTarget) queue.finishClose(key);
      }}
      className={styles.toast}
    >
      <div ref={innerRef} className={styles.inner}>
        <div className={styles.lead}>
          <span className={styles.icon} aria-hidden="true">
            {content.icon ?? <ToneIcon />}
          </span>
          <AriaToastContent className={styles.content}>
            <Text slot="title" className={styles.title}>
              {content.title}
            </Text>
            {content.description != null && content.description !== false && (
              <Text slot="description" className={styles.description}>
                {content.description}
              </Text>
            )}
          </AriaToastContent>
        </div>
        {content.action && (
          <Button
            size="sm"
            variant={tone === 'danger' || tone === 'warning' ? 'contrast' : 'outline'}
            className={styles.action}
            onPress={() => {
              content.action?.onAction();
              queue.close(key);
            }}
          >
            {content.action.label}
          </Button>
        )}
      </div>
      <AriaButton slot="close" className={styles.close}>
        <IconX aria-hidden="true" stroke={2} />
      </AriaButton>
    </AriaToast>
  );
}
