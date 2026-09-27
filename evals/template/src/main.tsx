// The app shell. It is the same in every eval run and is not scored. Do not edit it.
// It renders src/screens/Screen.tsx inside a ThemeScope chosen by the URL:
//   /?tenant=vela|harbor|qamar|care|house&scheme=light|dark&locale=en-IN|ar-AE&density=comfortable|compact
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeScope } from '@strata/react';
import '@strata/react/styles.css';
import '@strata/tokens/dist/strata.css';
import './app.css';
import Screen from './screens/Screen';

const q = new URLSearchParams(location.search);
const density = q.get('density');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeScope
      theme={q.get('tenant') ?? 'vela'}
      scheme={q.get('scheme') === 'dark' ? 'dark' : 'light'}
      locale={q.get('locale') ?? 'en-IN'}
      density={density === 'compact' || density === 'comfortable' ? density : undefined}
      className="app"
    >
      <main>
        <Screen />
      </main>
    </ThemeScope>
  </StrictMode>,
);
