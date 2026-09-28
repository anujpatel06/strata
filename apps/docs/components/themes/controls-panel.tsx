'use client';

import { IconRotate } from '@syntara/icons';
import {
  Badge,
  Button,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@syntara/react';
import { TYPE_PAIRS, type Density, type NeutralTemperature, type Shape, type TypePairId } from '@syntara/theme-engine';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { Key, Selection } from 'react-aria-components';
import { DraftCopyNote, isDraftCopy } from '@/components/page/draft-copy-note';
import { ColorControl } from './color-control';
import { DensityGlyph, ShapeGlyph } from './glyphs';
import { findPreset, isTypePairId, oneOf, DENSITIES, NEUTRALS, SHAPES } from './state';
import { useThemes } from './themes-provider';
import styles from './controls.module.css';

const NEUTRAL_LABEL: Record<NeutralTemperature, string> = { cool: 'Cool', neutral: 'Neutral', warm: 'Warm', paper: 'Paper' };
const SHAPE_LABEL: Record<Shape, string> = { sharp: 'Sharp', soft: 'Soft', round: 'Round' };
const SHAPE_HINT: Record<Shape, string> = { sharp: '2px', soft: '8px', round: '16px' };
const DENSITY_LABEL: Record<Density, string> = { comfortable: 'Comfortable', compact: 'Compact' };

const TYPE_PAIR_LIST = Object.values(TYPE_PAIRS);

/** "Precise — Inter Tight / Inter" → ["Precise", "Inter Tight / Inter"]. */
function splitPairLabel(label: string): [string, string] {
  const [name = label, fonts = ''] = label.split(' — ');
  return [name, fonts];
}

function firstKey(keys: Selection): string | undefined {
  if (keys === 'all') return undefined;
  const [k] = keys;
  return k == null ? undefined : String(k);
}

/** A labelled segmented control. The visible label names the group (ToggleButtonGroup draws none). */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  render: (value: T) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={styles.field}>
      <span id={id} className={styles.label}>
        {label}
      </span>
      <ToggleButtonGroup
        aria-labelledby={id}
        size="sm"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const next = oneOf(firstKey(keys), options);
          if (next) onChange(next);
        }}
        className={styles.segmented}
      >
        {options.map((option) => (
          <ToggleButton key={option} id={option} className={styles.segment}>
            {render(option)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

export function ControlsPanel() {
  const { state, dispatch, presets, preset, edited, presetThemes } = useThemes();
  const { brand } = state;
  const headingId = useId();
  const accentLabelId = useId();

  // Remember the last accent so switching it off and on again doesn't lose it.
  const lastAccent = useRef<string | undefined>(brand.accent);
  useEffect(() => {
    if (brand.accent) lastAccent.current = brand.accent;
  }, [brand.accent]);
  const accentOn = brand.accent !== undefined;
  const draftNotes = [
    ...new Map(presets.map((p) => p.copyReview).filter(isDraftCopy).map((r) => [r.note, r] as const)).values(),
  ];

  const pair = TYPE_PAIRS[brand.typePair] ?? TYPE_PAIRS.precise;
  const [, pairFonts] = splitPairLabel(pair.label);

  return (
    <section className={styles.panel} aria-labelledby={headingId}>
      <div className={styles.head}>
        <h2 id={headingId} className={styles.title}>
          Brand inputs
          {edited && (
            <Badge size="sm" tone="neutral" variant="outline">
              Edited
            </Badge>
          )}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          isDisabled={!edited}
          onPress={() => dispatch({ type: 'reset', preset })}
          aria-label={`Reset to the ${preset.label} preset`}
          className={styles.reset}
        >
          <IconRotate aria-hidden />
          Reset
        </Button>
      </div>

      <RadioGroup
        label="Start from"
        variant="card"
        value={state.tenant}
        onChange={(id) => dispatch({ type: 'selectPreset', preset: findPreset(presets, id) })}
        className={styles.presets}
      >
        {presets.map((p) => {
          const ramps = presetThemes[p.id]?.schemes.light.ramps;
          const swatches = ramps ? [ramps.primary[8], ramps.accent[8], ramps.neutral[8]] : [];
          return (
            <Radio
              key={p.id}
              value={p.id}
              className={styles.preset}
              description={<span lang={p.industryLang}>{p.industry}</span>}
            >
              <span className={styles.presetName}>{p.label}</span>
              <span className={styles.presetSwatches} aria-hidden="true">
                {swatches.map((hex, i) => (
                  <span key={i} className={styles.dot} style={{ backgroundColor: hex }} />
                ))}
              </span>
            </Radio>
          );
        })}
      </RadioGroup>
      {/* A preset card shows its tenant's industry in the tenant's own words; any still in draft say so here, under
          the cards, in the panel's voice. One note per distinct note text. */}
      {draftNotes.length > 0 && (
        <div className={styles.copyNotes}>
          {draftNotes.map((review) => (
            <DraftCopyNote key={review.note} review={review} />
          ))}
        </div>
      )}

      <ColorControl label="Primary colour" value={brand.primary} onChange={(hex) => dispatch({ type: 'setPrimary', hex })} />

      <div className={styles.field}>
        <div className={styles.fieldHead}>
          <span id={accentLabelId} className={styles.label}>
            Accent colour
          </span>
          <Switch
            aria-label="Use a separate accent colour"
            isSelected={accentOn}
            onChange={(on) => dispatch({ type: 'setAccent', hex: on ? (lastAccent.current ?? brand.primary) : undefined })}
            className={styles.accentSwitch}
          />
        </div>
        {accentOn && brand.accent ? (
          <ColorControl
            label="Accent colour"
            labelledBy={accentLabelId}
            value={brand.accent}
            onChange={(hex) => dispatch({ type: 'setAccent', hex })}
          />
        ) : (
          <p className={styles.hint}>Off — the accent follows the primary colour.</p>
        )}
      </div>

      <Segmented
        label="Neutrals"
        options={NEUTRALS}
        value={brand.neutral}
        onChange={(neutral) => dispatch({ type: 'setNeutral', neutral })}
        render={(n) => NEUTRAL_LABEL[n]}
      />

      <Segmented
        label="Shape"
        options={SHAPES}
        value={brand.shape}
        onChange={(shape) => dispatch({ type: 'setShape', shape })}
        render={(s) => (
          <>
            <ShapeGlyph shape={s} />
            {SHAPE_LABEL[s]}
            <span className="visually-hidden">, {SHAPE_HINT[s]} corners</span>
          </>
        )}
      />

      <Segmented
        label="Density"
        options={DENSITIES}
        value={brand.density}
        onChange={(density) => dispatch({ type: 'setDensity', density })}
        render={(d) => (
          <>
            <DensityGlyph density={d} />
            {DENSITY_LABEL[d]}
          </>
        )}
      />

      <div className={styles.field}>
        <Select
          label="Type pair"
          selectedKey={brand.typePair}
          onSelectionChange={(key: Key | null) => {
            const id = key == null ? undefined : String(key);
            if (isTypePairId(id)) dispatch({ type: 'setTypePair', typePair: id as TypePairId });
          }}
        >
          {TYPE_PAIR_LIST.map((p) => {
            const [name, fonts] = splitPairLabel(p.label);
            return (
              <SelectItem key={p.id} id={p.id} textValue={name} description={fonts}>
                {name}
              </SelectItem>
            );
          })}
        </Select>
        <div className={styles.specimen} aria-hidden="true">
          <span className={styles.ag} style={{ fontFamily: pair.heading, letterSpacing: pair.headingTracking }}>
            Ag
          </span>
          <span className={styles.specimenFonts} style={{ fontFamily: pair.body }}>
            {pairFonts}
          </span>
          <span className={styles.specimenText} style={{ fontFamily: pair.body }}>
            {pair.supportsArabic ? (
              <>
                Latin and Arabic ·{' '}
                <bdi lang="ar" dir="rtl">
                  أهلاً وسهلاً
                </bdi>
              </>
            ) : (
              'Sphinx of black quartz, judge my vow.'
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
