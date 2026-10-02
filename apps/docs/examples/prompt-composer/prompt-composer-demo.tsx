'use client';

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { ComposerButton, ComposerSelect, PromptComposer, ThemeScope } from '@syntara/react';
import { IconBolt, IconBrain, IconMicrophone, IconMicroscope, IconPlus, IconScale, IconSparkles } from '@syntara/icons';

/** The demo speaks the language of the brand picked in the preview: Qamar in Arabic, Haat in Hindi. */
const COPY = {
  en: {
    locale: 'en-US',
    label: 'Message',
    placeholder: 'Ask anything…',
    attach: 'Attach a file',
    style: 'Style',
    styles: ['Normal', 'Concise', 'Explanatory'],
    reasoning: 'Reasoning',
    modes: ['Quick answer', 'Balanced', 'DeepThink', 'Research'],
    voice: 'Voice',
    send: 'Send',
    stop: 'Stop',
  },
  ar: {
    locale: 'ar-AE',
    label: 'الرسالة',
    placeholder: 'اسأل عن أي شيء…',
    attach: 'إرفاق ملف',
    style: 'الأسلوب',
    styles: ['عادي', 'موجز', 'توضيحي'],
    reasoning: 'التفكير',
    modes: ['إجابة سريعة', 'متوازن', 'تفكير عميق', 'بحث'],
    voice: 'صوت',
    send: 'إرسال',
    stop: 'إيقاف',
  },
  // Draft copy, like the rest of Haat's: waiting for a Hindi reader's review.
  hi: {
    locale: 'hi-IN',
    label: 'संदेश',
    placeholder: 'कुछ भी पूछें…',
    attach: 'फ़ाइल जोड़ें',
    style: 'शैली',
    styles: ['सामान्य', 'संक्षिप्त', 'विस्तार से'],
    reasoning: 'सोच',
    modes: ['तुरंत जवाब', 'संतुलित', 'गहरी सोच', 'रिसर्च'],
    voice: 'आवाज़',
    send: 'भेजें',
    stop: 'रोकें',
  },
} as const;

const LANGUAGE_BY_TENANT: Record<string, keyof typeof COPY> = { qamar: 'ar', haat: 'hi' };

/** Watches the nearest themed ancestor, so switching brand in the preview switches the copy too. */
function useTenant(ref: RefObject<HTMLElement | null>): string | null {
  const [tenant, setTenant] = useState<string | null>(null);
  useEffect(() => {
    const scope = ref.current?.parentElement?.closest('[data-syntara-theme]');
    if (!scope) return;
    const read = () => setTenant(scope.getAttribute('data-syntara-theme'));
    read();
    const mo = new MutationObserver(read);
    mo.observe(scope, { attributes: true, attributeFilter: ['data-syntara-theme'] });
    return () => mo.disconnect();
  }, [ref]);
  return tenant;
}

// A fixed field of characters (no Math.random) so the statically built page hydrates identically.
const GLYPHS = 'ΣΩπσμβ+*@&.KLMNQRSTUVWXYZ0123456789';
const FIELD = Array.from({ length: 18 }, (_, row) =>
  Array.from({ length: 64 }, (_, col) => {
    const n = (row * 131 + col * 71 + row * col * 17) % 97;
    return n % 3 === 0 ? ' ' : GLYPHS[n % GLYPHS.length];
  }).join(' '),
).join('\n');

function orb(role: string, place: CSSProperties): CSSProperties {
  return {
    position: 'absolute',
    ...place,
    inlineSize: '34%',
    aspectRatio: '1',
    borderRadius: '50%',
    background: `radial-gradient(closest-side, var(--syntara-color-${role}), transparent)`,
    opacity: 0.85,
  };
}

export default function Example() {
  const ref = useRef<HTMLDivElement>(null);
  const tenant = useTenant(ref);
  const t = COPY[LANGUAGE_BY_TENANT[tenant ?? ''] ?? 'en'];
  const rtl = t.locale.startsWith('ar');
  const [pending, setPending] = useState(false);

  // Pretend a reply takes three seconds, so the stop button and the breathing glow can be seen.
  useEffect(() => {
    if (!pending) return;
    const id = setTimeout(() => setPending(false), 3000);
    return () => clearTimeout(id);
  }, [pending]);

  // The warm light sits at the start of the line, like the composer's glow, so it swaps sides in Arabic.
  const [warm, cool] = rtl ? ['88%', '12%'] : ['12%', '88%'];

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        inlineSize: '100%',
        maxInlineSize: '44rem',
        paddingBlock: 'var(--syntara-space-16)',
        paddingInline: 'var(--syntara-space-4)',
      }}
    >
      <pre
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          margin: 0,
          fontFamily: 'var(--syntara-font-mono)',
          fontSize: 'var(--syntara-font-size-xs)',
          lineHeight: 1.9,
          whiteSpace: 'pre',
          color: 'transparent',
          backgroundImage: `radial-gradient(45% 70% at ${warm} 30%, var(--syntara-color-feedback-warning-solid), transparent), radial-gradient(45% 70% at ${cool} 70%, var(--syntara-color-feedback-info-solid), transparent)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          // Fade the field out towards every edge, so it dissolves into the page instead of ending in a box.
          // (#000 is mask opacity, never painted: the text colour here is transparent, so currentColor would hide it all.)
          maskImage: 'radial-gradient(closest-side, #000 65%, transparent)',
          WebkitMaskImage: 'radial-gradient(closest-side, #000 65%, transparent)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {FIELD}
      </pre>
      {/* Two soft lights straddling the composer's corners. Half of each sits under the glass, which frosts it
          into a wash of colour; that is what makes the glass read as glass. */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={orb('feedback-warning-solid', rtl ? { insetInlineEnd: '8%', top: '2%' } : { insetInlineStart: '8%', top: '2%' })} />
        <div style={orb('feedback-info-solid', rtl ? { insetInlineStart: '8%', bottom: '2%' } : { insetInlineEnd: '8%', bottom: '2%' })} />
      </div>
      {/* A locale-only scope: keeps the preview's brand, sets lang, dir and React Aria's locale. */}
      <ThemeScope locale={t.locale}>
        <PromptComposer
          key={t.locale}
          glow="spectrum"
          surface="glass"
          label={t.label}
          placeholder={t.placeholder}
          sendLabel={t.send}
          stopLabel={t.stop}
          isPending={pending}
          onSubmit={() => setPending(true)}
          onStop={() => setPending(false)}
          startActions={
            <>
              <ComposerButton aria-label={t.attach} icon={<IconPlus />} />
              <ComposerSelect
                label={t.style}
                options={[
                  { id: 'normal', label: t.styles[0], icon: <IconSparkles /> },
                  { id: 'concise', label: t.styles[1], icon: <IconBolt /> },
                  { id: 'explain', label: t.styles[2], icon: <IconMicroscope /> },
                ]}
              />
              <ComposerSelect
                label={t.reasoning}
                defaultSelectedId="deep"
                options={[
                  { id: 'quick', label: t.modes[0], icon: <IconBolt /> },
                  { id: 'balanced', label: t.modes[1], icon: <IconScale /> },
                  { id: 'deep', label: t.modes[2], icon: <IconBrain /> },
                  { id: 'research', label: t.modes[3], icon: <IconMicroscope /> },
                ]}
              />
            </>
          }
          endActions={<ComposerButton icon={<IconMicrophone />}>{t.voice}</ComposerButton>}
        />
      </ThemeScope>
    </div>
  );
}
