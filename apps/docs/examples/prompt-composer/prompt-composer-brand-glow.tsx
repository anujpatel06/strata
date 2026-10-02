'use client';

import { ComposerSelect, PromptComposer } from '@syntara/react';
import { IconBolt, IconBrain } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: '36rem', paddingBlock: 'var(--syntara-space-10)' }}>
      <PromptComposer
        glow="brand"
        placeholder="Ask about your account…"
        startActions={
          <ComposerSelect
            label="Reasoning"
            options={[
              { id: 'quick', label: 'Quick answer', icon: <IconBolt /> },
              { id: 'deep', label: 'DeepThink', icon: <IconBrain /> },
            ]}
          />
        }
      />
    </div>
  );
}
