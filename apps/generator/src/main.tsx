import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './chrome.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Strata Brand Generator: #root element missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
