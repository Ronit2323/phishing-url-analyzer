import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { loadTopDomains } from './lib/urlAnalyzer';

async function startApp() {
  await loadTopDomains(); // load the txt file first

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();