import { useId } from 'react';
import { IconCheck } from '@syntara/icons';
import { TENANT_TAGLINES, type Tenant, type TenantId } from '../tenants';
import styles from './PresetPicker.module.css';
import ui from './ui.module.css';

export interface PresetSwatches {
  primary: string;
  accent: string;
  canvas: string;
}

interface PresetPickerProps {
  tenants: readonly Tenant[];
  selected: TenantId;
  edited: boolean;
  swatches: Record<TenantId, PresetSwatches>;
  onSelect: (id: TenantId) => void;
  onReset: () => void;
}

export function PresetPicker({ tenants, selected, edited, swatches, onSelect, onReset }: PresetPickerProps) {
  const name = useId();
  return (
    <div className={styles.root}>
      <fieldset className={ui.fieldset}>
        <legend className={ui.label}>Start from</legend>
        <div className={styles.list}>
          {tenants.map((tenant) => {
            const id = `${name}-${tenant.id}`;
            const isSelected = tenant.id === selected;
            const tagline = TENANT_TAGLINES[tenant.id];
            const sw = swatches[tenant.id];
            return (
              <div key={tenant.id} className={styles.item}>
                <input
                  id={id}
                  className={styles.input}
                  type="radio"
                  name={name}
                  value={tenant.id}
                  checked={isSelected}
                  onChange={() => onSelect(tenant.id)}
                />
                <label htmlFor={id} className={styles.card}>
                  <span className={styles.swatches} aria-hidden="true">
                    <span className={ui.swatch} style={{ backgroundColor: sw.primary }} />
                    <span className={ui.swatch} style={{ backgroundColor: sw.accent }} />
                    <span className={ui.swatch} style={{ backgroundColor: sw.canvas }} />
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>
                      {tenant.brand.name}
                      {isSelected && edited && <span className={styles.edited}>edited</span>}
                    </span>
                    <span className={styles.tagline}>
                      {tagline.industry} · <span lang={tagline.languageLang}>{tagline.language}</span>
                    </span>
                  </span>
                  <span className={styles.check} aria-hidden="true">
                    {isSelected && <IconCheck size={16} stroke={2.25} />}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
      {edited && (
        <button type="button" className={`${ui.btn} ${ui.btnText} ${styles.reset}`} onClick={onReset}>
          Reset
          <span className={ui.srOnly}> to {tenants.find((t) => t.id === selected)?.brand.name} preset</span>
        </button>
      )}
    </div>
  );
}
