import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Prepend custom VITE_API_URL to relative fetches in production or Vercel, with local sandbox fallback
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = import.meta.env.VITE_API_URL || '';

  // If already in offline sandbox mode, route immediately to local simulation
  if (window.__DC_OFFLINE_SANDBOX__) {
    const { simulateFetch } = await import('./utils/mockApi.js');
    return simulateFetch(input, init);
  }

  if (baseUrl) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${baseUrl}${input}`;
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${baseUrl}${input.url}`, input);
    }
  }

  try {
    const res = await originalFetch(input, init);
    // If we are on Vercel/production, did not specify a backend API URL, and got a 404 on a relative API path,
    // trigger dynamic fallback to Local Offline Sandbox Mode
    if (!res.ok && res.status === 404 && typeof input === 'string' && input.startsWith('/api') && !baseUrl && !isLocal) {
      console.warn('API returned 404 on static deployment. Activating Local Sandbox Mode...');
      window.__DC_OFFLINE_SANDBOX__ = true;
      const { simulateFetch } = await import('./utils/mockApi.js');
      return simulateFetch(input, init);
    }
    return res;
  } catch (e) {
    // If the request fails entirely at the network layer (e.g., local server is down) and it was a relative API call
    if (typeof input === 'string' && input.startsWith('/api') && !baseUrl) {
      console.warn('Backend server offline. Activating Local Sandbox Mode...');
      window.__DC_OFFLINE_SANDBOX__ = true;
      const { simulateFetch } = await import('./utils/mockApi.js');
      return simulateFetch(input, init);
    }
    throw e;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
