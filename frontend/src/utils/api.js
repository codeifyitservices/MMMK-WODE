const isLocalhost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

const API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (isLocalhost
    ? 'http://localhost:3001'
    : (typeof window !== 'undefined' ? window.location.origin : ''));

export default API_URL;
