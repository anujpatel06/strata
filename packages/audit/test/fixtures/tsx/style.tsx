import type { CSSProperties } from 'react';

const shared = { marginRight: 4 } as const; // expect: physical-property, off-scale-space

export function Fires({ on }: { on: boolean }) {
  return (
    <div
      style={{
        color: '#1f56e0', // expect: raw-color
        backgroundColor: on ? 'white' : 'rgb(0, 0, 0)', // expect: raw-color, raw-color
        marginLeft: 8, // expect: physical-property, off-scale-space
        padding: '4px 10px', // expect: off-scale-space, off-scale-space
        top: -8, // expect: physical-property, off-scale-space
        borderRadius: 6, // expect: off-scale-radius
        fontSize: '14px', // expect: off-scale-font-size
        fontWeight: 600, // expect: raw-font-weight
        fontFamily: 'Inter, sans-serif', // expect: font-family-literal
        textAlign: 'right', // expect: physical-property
        '--_c': '#abcdef', // expect: raw-color
      } as CSSProperties}
    >
      <span style={shared} />
      <svg aria-hidden="true"><path d="M0 0" fill="#000" stroke="red" /></svg> {/* expect: raw-color, raw-color */}
    </div>
  );
}

export function Passes({ on, size, tint }: { on: boolean; size: number; tint: string }) {
  return (
    <div
      className="text-[#fff] ml-2"
      style={{
        color: 'var(--strata-color-text-default)',
        backgroundColor: on ? 'transparent' : 'var(--strata-color-surface-raised)',
        marginInlineStart: 'var(--strata-space-2)',
        padding: 0,
        margin: '0 auto',
        insetInlineStart: size,
        inlineSize: 320,
        borderRadius: '50%',
        fontWeight: 'var(--strata-font-weight-medium)',
        lineHeight: 1.5,
        opacity: 0.5,
        zIndex: 10,
        flex: 1,
        outlineOffset: 2,
        borderWidth: 1,
        '--_c': tint,
        '--_i': 3,
        transform: `translate(${size}px, 0)`,
      } as CSSProperties}
    >
      <svg aria-hidden="true"><path d="M0 0" fill="none" stroke="currentColor" /></svg>
      <p title="#fff is white">{'#fff'}</p>
    </div>
  );
}
