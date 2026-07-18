import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/app';
import { initCampaignSync } from '@/features/campaign/model/use-campaign-store';
import { initSessionSync } from '@/features/focus-session/model/use-focus-store';
import '@/app/styles/global.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Under Tauri, bind this window to the authoritative Rust session; no-op in a browser.
void initSessionSync();
void initCampaignSync();
