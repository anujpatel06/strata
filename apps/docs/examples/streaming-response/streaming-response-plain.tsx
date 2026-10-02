'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, StreamingResponse, type StreamingStatus } from '@syntara/react';

const ANSWER =
  'You can change the delivery address until the order is packed. Open the order, choose Edit address, and pick a saved address or add a new one. If the order has already shipped, ask the courier to hold it at a pickup point instead.';

export default function Example() {
  const [status, setStatus] = useState<StreamingStatus>('complete');
  const [text, setText] = useState('');
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = (next: StreamingStatus) => {
    clearInterval(timer.current);
    setStatus(next);
  };
  const ask = () => {
    let shown = 0;
    setText('');
    setStatus('streaming');
    timer.current = setInterval(() => {
      shown = Math.min(ANSWER.length, shown + 3);
      setText(ANSWER.slice(0, shown));
      if (shown === ANSWER.length) stop('complete');
    }, 30);
  };
  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', maxInlineSize: '36rem' }}>
      <div style={{ display: 'flex', gap: 'var(--syntara-space-2)' }}>
        <Button onPress={ask} isDisabled={status === 'streaming'}>
          Ask: can I change my delivery address?
        </Button>
        {status === 'streaming' && (
          <Button variant="outline" onPress={() => stop('stopped')}>
            Stop
          </Button>
        )}
      </div>
      {text !== '' && <StreamingResponse status={status} text={text} />}
    </div>
  );
}
