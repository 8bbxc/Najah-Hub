// Centralized API + SOCKET constants — prefer env vars, fallback to auto-detection
const DEFAULT_PROD = 'https://najah-backend-ykto.onrender.com';
const fromEnv = import.meta.env.VITE_API_BASE && String(import.meta.env.VITE_API_BASE).trim();
let AUTO_API;
if (typeof window !== 'undefined' && window.location && window.location.hostname) {
  const host = window.location.hostname;
  if (host === 'localhost' || host.startsWith('127.') || host === '::1') {
    AUTO_API = 'http://localhost:5000';
  } else {
    AUTO_API = DEFAULT_PROD;
  }
} else {
  AUTO_API = DEFAULT_PROD;
}

export const API = fromEnv || AUTO_API;
export const SOCKET = import.meta.env.VITE_SOCKET_URL || API;

// Usage:
// import { API, SOCKET } from '../utils/api';
// axios.get(`${API}/api/...`)
// const socket = io(SOCKET)
