import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Prepend custom VITE_API_URL to relative fetches in production or Vercel
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (baseUrl) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${baseUrl}${input}`;
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${baseUrl}${input.url}`, input);
    }
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
