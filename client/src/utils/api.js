// Centralized API + SOCKET constants — consume Vite env vars when available
export const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
// Socket.io accepts the same HTTP origin; allow explicit override via VITE_SOCKET_URL
export const SOCKET = import.meta.env.VITE_SOCKET_URL || API;

// Usage:
// import { API, SOCKET } from '../utils/api';
// axios.get(`${API}/api/...`)
// const socket = io(SOCKET)
