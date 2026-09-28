/** Syntara mark: three offset layers — one system, stacked brands. Monochrome, inherits currentColor. */
export function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="2" y="2.5" width="14" height="5" rx="1.5" fill="currentColor" opacity="0.32" />
      <rect x="5" y="9.5" width="14" height="5" rx="1.5" fill="currentColor" opacity="0.64" />
      <rect x="8" y="16.5" width="14" height="5" rx="1.5" fill="currentColor" />
    </svg>
  );
}
