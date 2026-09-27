import { useEffect, useId, useRef, type Dispatch } from 'react';
import type { Density, NeutralTemperature, Shape } from '@strata/theme-engine';
import { TENANTS, type TenantId } from '../tenants';
import type { AppAction, AppState } from '../url-state';
import { ColorField } from './ColorField';
import { DensityGlyph, ShapeGlyph } from './Glyphs';
import { PresetPicker, type PresetSwatches } from './PresetPicker';
import { Segmented, type SegmentedOption } from './Segmented';
import { Switch } from './Switch';
import { TypeSelect } from './TypeSelect';
import styles from './InputsPanel.module.css';
import ui from './ui.module.css';

const NEUTRAL_OPTIONS: ReadonlyArray<SegmentedOption<NeutralTemperature>> = [
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'warm', label: 'Warm' },
  { value: 'paper', label: 'Paper' },
];

const SHAPE_OPTIONS: ReadonlyArray<SegmentedOption<Shape>> = [
  { value: 'sharp', label: 'Sharp', icon: <ShapeGlyph shape="sharp" /> },
  { value: 'soft', label: 'Soft', icon: <ShapeGlyph shape="soft" /> },
  { value: 'round', label: 'Round', icon: <ShapeGlyph shape="round" /> },
];

const DENSITY_OPTIONS: ReadonlyArray<SegmentedOption<Density>> = [
  { value: 'comfortable', label: 'Comfortable', icon: <DensityGlyph density="comfortable" /> },
  { value: 'compact', label: 'Compact', icon: <DensityGlyph density="compact" /> },
];

interface InputsPanelProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  edited: boolean;
  presetSwatches: Record<TenantId, PresetSwatches>;
}

export function InputsPanel({ state, dispatch, edited, presetSwatches }: InputsPanelProps) {
  const { brand } = state;
  const primaryLabelId = useId();
  const accentLabelId = useId();
  // Remember the last accent so toggling the switch off and on again doesn't lose it.
  const lastAccent = useRef<string | undefined>(brand.accent);
  useEffect(() => {
    if (brand.accent) lastAccent.current = brand.accent;
  }, [brand.accent]);

  const accentOn = brand.accent !== undefined;

  return (
    <div className={styles.panel}>
      <h2 className={ui.srOnly}>Brand inputs</h2>

      <PresetPicker
        tenants={TENANTS}
        selected={state.tenant}
        edited={edited}
        swatches={presetSwatches}
        onSelect={(tenant) => dispatch({ type: 'selectTenant', tenant })}
        onReset={() => dispatch({ type: 'resetBrand' })}
      />

      <div role="group" aria-labelledby={primaryLabelId}>
        <span id={primaryLabelId} className={ui.label}>
          Primary colour
        </span>
        <ColorField name="Primary colour" value={brand.primary} onChange={(hex) => dispatch({ type: 'setPrimary', hex })} />
      </div>

      <div role="group" aria-labelledby={accentLabelId}>
        <span id={accentLabelId} className={ui.label}>
          Accent
        </span>
        <Switch
          label="Use a separate accent"
          checked={accentOn}
          onChange={(on) =>
            dispatch({ type: 'setAccent', hex: on ? (lastAccent.current ?? brand.primary) : undefined })
          }
        />
        {accentOn && brand.accent ? (
          <div className={styles.accentField}>
            <ColorField name="Accent colour" value={brand.accent} onChange={(hex) => dispatch({ type: 'setAccent', hex })} />
          </div>
        ) : (
          <p className={`${ui.hint} ${styles.accentHint}`}>Accent follows the primary colour.</p>
        )}
      </div>

      <Segmented
        legend="Neutrals"
        options={NEUTRAL_OPTIONS}
        value={brand.neutral}
        onChange={(neutral) => dispatch({ type: 'setNeutral', neutral })}
      />

      <Segmented
        legend="Shape"
        options={SHAPE_OPTIONS}
        value={brand.shape}
        onChange={(shape) => dispatch({ type: 'setShape', shape })}
      />

      <TypeSelect value={brand.typePair} onChange={(typePair) => dispatch({ type: 'setTypePair', typePair })} />

      <Segmented
        legend="Density"
        options={DENSITY_OPTIONS}
        value={brand.density}
        onChange={(density) => dispatch({ type: 'setDensity', density })}
      />
    </div>
  );
}
