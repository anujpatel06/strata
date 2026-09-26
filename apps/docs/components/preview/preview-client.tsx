'use client';

import {
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
  IconMoon,
  IconSun,
  IconTextDirectionLtr,
  IconTextDirectionRtl,
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
import { Component, useEffect, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { examples } from '@/lib/examples.generated';
import styles from './preview.module.css';

export interface PreviewTenant {
  id: string;
  name: string;
  density: 'comfortable' | 'compact';
}

type Scheme = 'light' | 'dark';
type Dir = 'ltr' | 'rtl';
type Density = 'comfortable' | 'compact';

/** The site's effective scheme (html attribute, or the OS preference when it is "auto"). */
function useSiteScheme(): Scheme {
  const [scheme, setScheme] = useState<Scheme>('light');
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const attr = document.documentElement.getAttribute('data-strata-scheme');
      setScheme(attr === 'dark' || (attr !== 'light' && media.matches) ? 'dark' : 'light');
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
  return scheme;
}

class ExampleBoundary extends Component<{ name: string; children: ReactNode }, { error?: Error }> {
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

function firstKey(keys: Set<Key>): string | undefined {
  const [k] = keys;
  return k == null ? undefined : String(k);
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

export interface PreviewClientProps {
  name: string;
  label: string;
  align: 'center' | 'start';
  tenants: PreviewTenant[];
  code: ReactNode;
}

export function PreviewClient({ name, label, align, tenants, code }: PreviewClientProps) {
  const Example = examples[name];
  const siteScheme = useSiteScheme();
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? 'house');
  /** undefined = follow the site's scheme. */
  const [scheme, setScheme] = useState<Scheme | undefined>();
  const [dir, setDir] = useState<Dir>('ltr');
  const [density, setDensity] = useState<Density | undefined>();

  const tenant = tenants.find((t) => t.id === tenantId) ?? tenants[0];
  const effectiveScheme = scheme ?? siteScheme;
  const effectiveDensity = density ?? tenant?.density ?? 'comfortable';

  return (
    <Tabs className={styles.root} defaultSelectedKey="preview">
      <TabList aria-label={`${label} example`} className={styles.tabs}>
        <Tab id="preview">Preview</Tab>
        <Tab id="code" isDisabled={code == null}>
          Code
        </Tab>
      </TabList>
      <TabPanel id="preview" shouldForceMount className={styles.panel}>
        <div className={styles.frame}>
          <div className={styles.toolbar}>
            <ToggleButtonGroup
              aria-label="Tenant"
              size="sm"
              disallowEmptySelection
              selectedKeys={[tenantId]}
              onSelectionChange={(keys) => {
                const next = firstKey(keys);
                if (next) setTenantId(next);
              }}
              className={styles.group}
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
            <div className={styles.toolbarEnd}>
              <ToggleButtonGroup
                aria-label="Colour scheme"
                size="sm"
                disallowEmptySelection
                selectedKeys={[effectiveScheme]}
                onSelectionChange={(keys) => setScheme(firstKey(keys) as Scheme)}
                className={styles.group}
              >
                <IconToggle id="light" label="Light">
                  <IconSun aria-hidden stroke={1.75} />
                </IconToggle>
                <IconToggle id="dark" label="Dark">
                  <IconMoon aria-hidden stroke={1.75} />
                </IconToggle>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                aria-label="Direction"
                size="sm"
                disallowEmptySelection
                selectedKeys={[dir]}
                onSelectionChange={(keys) => setDir(firstKey(keys) as Dir)}
                className={styles.group}
              >
                <IconToggle id="ltr" label="Left to right">
                  <IconTextDirectionLtr aria-hidden stroke={1.75} />
                </IconToggle>
                <IconToggle id="rtl" label="Right to left">
                  <IconTextDirectionRtl aria-hidden stroke={1.75} />
                </IconToggle>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                aria-label="Density"
                size="sm"
                disallowEmptySelection
                selectedKeys={[effectiveDensity]}
                onSelectionChange={(keys) => setDensity(firstKey(keys) as Density)}
                className={styles.group}
              >
                <IconToggle id="comfortable" label="Comfortable">
                  <IconBaselineDensityMedium aria-hidden stroke={1.75} />
                </IconToggle>
                <IconToggle id="compact" label="Compact">
                  <IconBaselineDensitySmall aria-hidden stroke={1.75} />
                </IconToggle>
              </ToggleButtonGroup>
            </div>
          </div>
          <ThemeScope
            theme={tenant?.id}
            data-strata-scheme={scheme ?? 'site'}
            density={density}
            locale={dir === 'rtl' ? 'ar-AE' : 'en-US'}
            className={styles.stage}
            data-align={align}
            role="region"
            aria-label={`${label} preview`}
          >
            {Example ? (
              <ExampleBoundary name={name}>
                <div className={styles.example}>
                  <Example />
                </div>
              </ExampleBoundary>
            ) : (
              <p className={styles.message}>
                The <code>{name}</code> example hasn’t been written yet.
              </p>
            )}
          </ThemeScope>
        </div>
      </TabPanel>
      <TabPanel id="code" className={styles.panel}>
        <div className={styles.codeFrame}>{code}</div>
      </TabPanel>
    </Tabs>
  );
}
