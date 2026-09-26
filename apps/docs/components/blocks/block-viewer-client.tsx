'use client';

import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconExternalLink,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import {
  Tab,
  TabList,
  TabPanel,
  Tabs,
  ThemeScope,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
} from '@strata/react';
import { Component, useEffect, useId, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { BLOCK_COMPONENTS } from './block-components';
import type { BlockTenant } from './block-data';
import styles from './block-viewer.module.css';

type Scheme = 'light' | 'dark';
type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; icon: ReactNode }[] = [
  { id: 'desktop', label: 'Desktop (full width)', icon: <IconDeviceDesktop aria-hidden stroke={1.75} /> },
  { id: 'tablet', label: 'Tablet (768px)', icon: <IconDeviceTablet aria-hidden stroke={1.75} /> },
  { id: 'mobile', label: 'Mobile (390px)', icon: <IconDeviceMobile aria-hidden stroke={1.75} /> },
];

/** The site's effective scheme (html attribute, or the OS preference when it is "auto"). */
function useSiteScheme(): Scheme {
  const [siteScheme, setSiteScheme] = useState<Scheme>('light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const attr = document.documentElement.getAttribute('data-strata-scheme');
      setSiteScheme(attr === 'dark' || (attr !== 'light' && media.matches) ? 'dark' : 'light');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-strata-scheme'] });
    media.addEventListener('change', read);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);
  return siteScheme;
}

function firstKey(keys: Set<Key>): string | undefined {
  const [k] = keys;
  return k == null ? undefined : String(k);
}

class BlockBoundary extends Component<{ name: string; children: ReactNode }, { error?: Error }> {
  override state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    if (this.state.error) {
      return (
        <p className={styles.message}>
          <strong>{this.props.name}</strong> failed to render: {this.state.error.message}
        </p>
      );
    }
    return this.props.children;
  }
}

function IconToggle({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <TooltipTrigger delay={500}>
      <ToggleButton id={id} aria-label={label} className={styles.iconToggle}>
        {children}
      </ToggleButton>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

export interface BlockViewerClientProps {
  name: string;
  title: string;
  description: string;
  tenants: BlockTenant[];
  /** Tenant id → that tenant's content for this block. */
  contents: Record<string, Record<string, unknown>>;
  code: ReactNode;
  install: ReactNode;
}

export function BlockViewerClient({ name, title, description, tenants, contents, code, install }: BlockViewerClientProps) {
  const titleId = useId();
  const Block = BLOCK_COMPONENTS[name];
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  /** undefined = follow the site's scheme (the theme CSS resolves data-strata-scheme="site"). */
  const [scheme, setScheme] = useState<Scheme | undefined>();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const siteScheme = useSiteScheme();

  const tenant = tenants.find((t) => t.id === tenantId) ?? tenants[0];
  const query = new URLSearchParams({ tenant: tenant?.id ?? '', ...(scheme ? { scheme } : {}) });

  return (
    <section className={styles.viewer} aria-labelledby={titleId} id={name}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          <a href={`#${name}`} className={styles.anchor}>
            {title}
          </a>
        </h2>
        <p className={styles.description}>{description}</p>
      </header>

      <Tabs
        variant="pill"
        selectedKey={view}
        onSelectionChange={(key) => setView(key === 'code' ? 'code' : 'preview')}
        className={styles.tabs}
      >
        <div className={styles.toolbar}>
          <TabList aria-label={`${title}: preview or code`} className={styles.viewTabs}>
            <Tab id="preview">Preview</Tab>
            <Tab id="code">Code</Tab>
          </TabList>

          <div className={styles.controls} hidden={view !== 'preview'}>
            <ToggleButtonGroup
              aria-label="Tenant"
              size="sm"
              disallowEmptySelection
              selectedKeys={[tenantId]}
              onSelectionChange={(keys) => {
                const next = firstKey(keys);
                if (next) setTenantId(next);
              }}
            >
              {tenants.map((t) => (
                <ToggleButton key={t.id} id={t.id} className={styles.tenantToggle}>
                  <span className={styles.dotRing} aria-hidden="true">
                    <span className={styles.dot} data-strata-theme={t.id} />
                  </span>
                  {t.name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <ToggleButtonGroup
              aria-label="Colour scheme"
              size="sm"
              disallowEmptySelection
              selectedKeys={[scheme ?? siteScheme]}
              onSelectionChange={(keys) => setScheme(firstKey(keys) as Scheme | undefined)}
            >
              <IconToggle id="light" label="Light">
                <IconSun aria-hidden stroke={1.75} />
              </IconToggle>
              <IconToggle id="dark" label="Dark">
                <IconMoon aria-hidden stroke={1.75} />
              </IconToggle>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              aria-label="Preview width"
              size="sm"
              disallowEmptySelection
              selectedKeys={[viewport]}
              onSelectionChange={(keys) => setViewport((firstKey(keys) as Viewport | undefined) ?? 'desktop')}
              className={styles.viewports}
            >
              {VIEWPORTS.map((v) => (
                <IconToggle key={v.id} id={v.id} label={v.label}>
                  {v.icon}
                </IconToggle>
              ))}
            </ToggleButtonGroup>

            <a
              href={`/blocks/${name}/view?${query.toString()}`}
              target="_blank"
              rel="noreferrer"
              className={styles.open}
            >
              <IconExternalLink aria-hidden stroke={1.75} />
              Open
              <span className="visually-hidden"> {title} in a new tab</span>
            </a>
          </div>
        </div>

        <TabPanel id="preview" shouldForceMount className={styles.panel}>
          <div className={styles.frame}>
            <div className={styles.viewport} data-viewport={viewport}>
              <ThemeScope
                theme={tenant?.id}
                data-strata-scheme={scheme ?? 'site'}
                locale={tenant?.locale}
                className={styles.scope}
                role="region"
                aria-label={`${title} preview, ${tenant?.name ?? ''}`}
              >
                {Block ? (
                  <BlockBoundary name={name}>
                    <Block key={tenant?.id} content={tenant ? contents[tenant.id] : undefined} headingLevel={3} />
                  </BlockBoundary>
                ) : (
                  <p className={styles.message}>
                    The <code>{name}</code> block isn’t registered.
                  </p>
                )}
              </ThemeScope>
            </div>
          </div>
        </TabPanel>
        <TabPanel id="code" className={styles.panel}>
          <div className={styles.code}>{code}</div>
        </TabPanel>
      </Tabs>

      <div className={styles.install}>
        <p className={styles.installLabel}>Install with the shadcn CLI</p>
        {install}
      </div>
    </section>
  );
}
