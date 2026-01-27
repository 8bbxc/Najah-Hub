import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply stored theme before React mounts to prevent flash of wrong theme
try {
  const stored = localStorage.getItem('dark');
  if (stored === '1') document.documentElement.classList.add('dark');
  else if (stored === '0') document.documentElement.classList.remove('dark');
} catch (e) {
  // ignore if localStorage unavailable
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
