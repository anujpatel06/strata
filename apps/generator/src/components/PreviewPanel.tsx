import { useMemo, type CSSProperties } from 'react';
import { toCssVariables, type Density, type Scheme, type Theme } from '@syntara/theme-engine';
import { OverviewScreen } from '../preview';
import type { Tenant } from '../tenants';
import styles from './PreviewPanel.module.css';

interface PreviewPanelProps {
  theme: Theme;
  scheme: Scheme;
  density: Density;
  tenant: Tenant;
}

/**
 * A browser-chrome frame around the reference screen. The frame's inner div is the only place brand tokens exist:
 * every --syntara-* variable is set inline from the generated theme, so re-skinning is one style recalculation.
 */
export function PreviewPanel({ theme, scheme, density, tenant }: PreviewPanelProps) {
  const vars = useMemo(() => toCssVariables(theme, scheme, density) as CSSProperties, [theme, scheme, density]);
  const host = `app.${tenant.id}.example`;
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <div className={styles.chromeBar} aria-hidden="true">
          <span className={styles.dots}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.url}>{host}</span>
          <span className={styles.dots} />
        </div>
        <div className={styles.viewport}>
          <div
            className={styles.themed}
            style={vars}
            data-syntara-scheme={scheme}
            data-syntara-density={density}
            dir={tenant.content.dir}
            lang={tenant.content.locale}
          >
            <OverviewScreen content={tenant.content} embedded />
          </div>
        </div>
      </div>
      <figcaption className={styles.caption}>Same components for every brand — only tokens and copy change.</figcaption>
    </figure>
  );
}
