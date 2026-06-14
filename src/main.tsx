import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const CURRENT_APP_VERSION = '1.0.16';
const VERSION_KEY = 'fptp_app_version';

// Keys that must NEVER be wiped (Supabase auth + user data)
const PROTECTED_KEYS = ['fptrainingpro-auth-v2', 'supabase.auth.token'];

function purgeAndReload() {
  // Clear all cache storage
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) caches.delete(name);
    });
  }

  // Unregister all service workers so the new one takes over immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) reg.unregister();
    });
  }

  // Wipe localStorage except protected auth/data keys
  const preserved: Record<string, string> = {};
  for (const key of PROTECTED_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) preserved[key] = val;
  }
  // Also preserve any key that looks like Supabase auth state
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('sb-') || k.includes('supabase'))) {
      const val = localStorage.getItem(k);
      if (val !== null) preserved[k] = val;
    }
  }

  localStorage.clear();

  // Restore protected keys
  for (const [k, v] of Object.entries(preserved)) {
    localStorage.setItem(k, v);
  }

  // Write new version and reload
  localStorage.setItem(VERSION_KEY, CURRENT_APP_VERSION);
  window.location.reload();
}

const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== CURRENT_APP_VERSION) {
  purgeAndReload();
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
