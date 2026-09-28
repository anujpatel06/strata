/**
 * The featured row: signature icons drawn large on their construction grid (every unit, the live area and the
 * keyline circle), each captioned with the one rule it shows. Server component; the numbers come from the spec.
 */
import { IconBell, IconCheck, IconChevronRight, IconCreditCard, IconSettings, type Icon } from '@syntara/icons';
import type { IconSpec } from './icon-data';
import styles from './icons.module.css';

function Construction({ spec }: { spec: IconSpec }) {
  const { grid, live, keylineRadius } = spec;
  const inset = (grid - live) / 2;
  const units = Array.from({ length: grid - 1 }, (_, i) => i + 1);
  return (
    <svg className={styles.construction} viewBox={`0 0 ${grid} ${grid}`} aria-hidden="true" focusable="false">
      <g className={styles.gridLines}>
        {units.map((u) => (
          <path key={`v${u}`} d={`M${u} 0V${grid}M0 ${u}H${grid}`} />
        ))}
      </g>
      <rect className={styles.liveArea} x={inset} y={inset} width={live} height={live} rx={1} />
      <circle className={styles.keyline} cx={grid / 2} cy={grid / 2} r={keylineRadius} />
    </svg>
  );
}

export function IconSpecimen({ spec }: { spec: IconSpec }) {
  const featured: Array<{ Glyph: Icon; rule: string }> = [
    { Glyph: IconCheck, rule: 'A curved check, not two straight strokes meeting at a corner.' },
    { Glyph: IconChevronRight, rule: 'A rounded tip. Every chevron and arrowhead shares it.' },
    { Glyph: IconBell, rule: 'Arc shoulders instead of corners.' },
    { Glyph: IconSettings, rule: 'Scalloped, not toothed.' },
    { Glyph: IconCreditCard, rule: `Box corners of ${spec.radii.replace(/ \([a-z]+\)/g, '').replaceAll(' / ', ', ')}. Never sharp.` },
  ];
  return (
    <figure className={styles.specimen}>
      <ul className={styles.featured}>
        {featured.map(({ Glyph, rule }, i) => (
          <li key={Glyph.iconName} className={styles.feature} data-hero={i === 0 || undefined}>
            <div className={styles.featureArt}>
              <Construction spec={spec} />
              <Glyph className={styles.featureGlyph} />
            </div>
            <p className={styles.featureCaption}>
              <code className={styles.featureName}>{Glyph.displayName}</code>
              <span className={styles.featureRule}>{rule}</span>
            </p>
          </li>
        ))}
      </ul>
      <figcaption className={styles.specimenCaption}>
        Drawn on a {spec.grid}px grid: the dashed square is the {spec.live}px live area, the circle the keyline. At this
        size the {spec.stroke} stroke scales with the drawing.
      </figcaption>
    </figure>
  );
}
