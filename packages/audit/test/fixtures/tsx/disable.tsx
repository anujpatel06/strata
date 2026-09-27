export function A() {
  return (
    <div>
      {/* strata-audit-disable-next-line native-element -- the skip link must work before hydration */}
      <a href="#main">Skip to content</a>
      {/* strata-audit-disable-next-line native-element */} {/* expect: native-element */}
      <a href="#main">Skip to content</a> {/* expect: native-element */}
      <div
        style={{
          // strata-audit-disable-next-line raw-color -- the partner's logo colour
          color: '#ff6600',
          background: '#ff6600', // expect: raw-color
        }}
      />
    </div>
  );
}
