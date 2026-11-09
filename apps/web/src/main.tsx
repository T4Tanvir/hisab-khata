import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Providers } from './app/providers';
import { applyInitialTheme } from './hooks/useTheme';
import './styles/global.css';

// Apply the saved theme before the first render (including login/signup pages)
applyInitialTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
);

// Offline app shell — production only, so the dev server's HMR is never cached
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failure only disables offline support
    });
  });
}
