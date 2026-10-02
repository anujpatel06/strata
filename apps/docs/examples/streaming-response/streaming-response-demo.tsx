'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Button,
  ResponseSource,
  ResponseSources,
  ResponseText,
  StreamingResponse,
  ThemeScope,
  type StreamingStatus,
} from '@syntara/react';
import { IconSparkles } from '@syntara/icons';

/** The demo speaks the language of the brand picked in the preview: Qamar in Arabic, Haat in Hindi. */
const COPY = {
  en: {
    locale: 'en-US',
    question: 'Can I change my delivery address?',
    answer:
      'You can change the delivery address until the order is packed. Open the order, choose Edit address, and pick a saved address or add a new one. If the order has already shipped, ask the courier to hold it at a pickup point instead.',
    sources: ['Changing your address', 'Delivery times', 'Pickup points'],
    again: 'Ask again',
    stop: 'Stop',
    label: 'Response',
    sourcesLabel: 'Sources',
    start: 'Writing response',
    writing: 'Writing…',
    complete: 'Response complete',
    stopped: 'Stopped',
  },
  ar: {
    locale: 'ar-AE',
    question: 'هل يمكنني تغيير عنوان التوصيل؟',
    answer:
      'يمكنك تغيير عنوان التوصيل حتى يتم تجهيز الطلب. افتح الطلب، واختر تعديل العنوان، ثم اختر عنوانًا محفوظًا أو أضف عنوانًا جديدًا. إذا كان الطلب قد شُحن بالفعل، فاطلب من شركة التوصيل الاحتفاظ به في نقطة استلام.',
    sources: ['تغيير العنوان', 'مواعيد التوصيل', 'نقاط الاستلام'],
    again: 'اسأل مجددًا',
    stop: 'إيقاف',
    label: 'الرد',
    sourcesLabel: 'المصادر',
    start: 'جارٍ كتابة الرد',
    writing: 'جارٍ الكتابة…',
    complete: 'اكتمل الرد',
    stopped: 'توقّف',
  },
  // Draft copy, like the rest of Haat's: waiting for a Hindi reader's review.
  hi: {
    locale: 'hi-IN',
    question: 'क्या मैं डिलीवरी का पता बदल सकता हूँ?',
    answer:
      'ऑर्डर पैक होने तक आप डिलीवरी का पता बदल सकते हैं। ऑर्डर खोलें, पता बदलें चुनें, और कोई सेव किया हुआ पता चुनें या नया पता जोड़ें। अगर ऑर्डर भेजा जा चुका है, तो कूरियर से उसे किसी पिकअप पॉइंट पर रोकने के लिए कहें।',
    sources: ['पता बदलना', 'डिलीवरी का समय', 'पिकअप पॉइंट'],
    again: 'फिर से पूछें',
    stop: 'रोकें',
    label: 'जवाब',
    sourcesLabel: 'स्रोत',
    start: 'जवाब लिखा जा रहा है',
    writing: 'लिखा जा रहा है…',
    complete: 'जवाब पूरा हुआ',
    stopped: 'रोका गया',
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

const THINK_MS = 1200; // the shimmer alone, before the first word
const WORD_MS = 70; // one word per tick

export default function Example() {
  const ref = useRef<HTMLDivElement>(null);
  const t = COPY[LANGUAGE_BY_TENANT[useTenant(ref) ?? ''] ?? 'en'];
  const [status, setStatus] = useState<StreamingStatus>('streaming');
  const [text, setText] = useState('');
  const [run, setRun] = useState(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Play the answer: a pause on the shimmer, then one word at a time. Replays on "Ask again" and on a language change.
  useEffect(() => {
    clear();
    setText('');
    setStatus('streaming');
    const words = t.answer.split(/(?<=\s)/);
    words.forEach((_, i) => {
      timers.current.push(setTimeout(() => setText(words.slice(0, i + 1).join('')), THINK_MS + i * WORD_MS));
    });
    timers.current.push(setTimeout(() => setStatus('complete'), THINK_MS + words.length * WORD_MS));
    return clear;
  }, [t, run]);

  return (
    <div ref={ref} style={{ inlineSize: '100%', maxInlineSize: '38rem' }}>
      <ThemeScope locale={t.locale}>
        <div style={{ display: 'grid', gap: 'var(--syntara-space-5)' }}>
          {/* The question, as a message bubble at the end of the line. */}
          <p
            style={{
              justifySelf: 'end',
              margin: 0,
              maxInlineSize: '80%',
              paddingBlock: 'var(--syntara-space-2)',
              paddingInline: 'var(--syntara-space-4)',
              borderRadius: 'var(--syntara-radius-container)',
              background: 'var(--syntara-color-surface-selected)',
              color: 'var(--syntara-color-text-default)',
              fontSize: 'var(--syntara-font-size-md)',
            }}
          >
            {t.question}
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--syntara-space-3)' }}>
            {/* The assistant's mark: a sparkle in a tile edged with the warm-to-cool sweep. */}
            <span
              aria-hidden
              style={{
                flex: 'none',
                display: 'inline-grid',
                placeItems: 'center',
                inlineSize: 'var(--syntara-space-8)',
                blockSize: 'var(--syntara-space-8)',
                borderRadius: '50%',
                border: '1px solid transparent',
                background:
                  'linear-gradient(var(--syntara-color-surface-raised), var(--syntara-color-surface-raised)) padding-box, linear-gradient(135deg, var(--syntara-color-feedback-warning-solid), var(--syntara-color-feedback-info-solid)) border-box',
                boxShadow: '0 0 var(--syntara-space-4) color-mix(in oklab, var(--syntara-color-feedback-info-solid) 35%, transparent)',
                color: 'var(--syntara-color-text-default)',
              }}
            >
              <IconSparkles />
            </span>

            <div style={{ flex: 1, minInlineSize: 0, paddingBlockStart: 'var(--syntara-space-1)' }}>
              <StreamingResponse
                status={status}
                text={text}
                label={t.label}
                startLabel={t.start}
                writingLabel={t.writing}
                completeLabel={t.complete}
                stoppedLabel={t.stopped}
              >
                <ResponseText text={text} />
                {status === 'complete' && (
                  <ResponseSources label={t.sourcesLabel}>
                    {t.sources.map((title, i) => (
                      <ResponseSource key={title} index={i + 1} href="#">
                        {title}
                      </ResponseSource>
                    ))}
                  </ResponseSources>
                )}
              </StreamingResponse>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {status === 'streaming' ? (
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  clear();
                  setStatus('stopped');
                }}
              >
                {t.stop}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onPress={() => setRun((n) => n + 1)}>
                {t.again}
              </Button>
            )}
          </div>
        </div>
      </ThemeScope>
    </div>
  );
}
