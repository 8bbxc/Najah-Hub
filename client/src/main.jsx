import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply stored theme before React mounts to prevent flash of wrong theme
try {
  let stored = localStorage.getItem('theme');
  if (stored === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    // default to light when no preference saved
    document.documentElement.classList.remove('dark');
    if (!stored) localStorage.setItem('theme', 'light');
  }
} catch (e) {
  // ignore if localStorage unavailable
}

// Listen for theme changes from anywhere in the app and apply immediately
try {
  window.addEventListener('themeChange', (ev) => {
    const t = ev?.detail || localStorage.getItem('theme') || 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', t); } catch (e) {}
  });
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
