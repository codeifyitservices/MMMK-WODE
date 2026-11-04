import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import store from './Redux/Store/store.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminAuthProvider from './context/AdminAuthProvider.jsx';
import UserAuthProvider from './context/userAuthProvider.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes cache validity
      gcTime: 15 * 60 * 1000, // Keep inactive queries in memory for 15 minutes
      refetchOnWindowFocus: false, // Prevent aggressive network requests on tab switch
      retry: 1,
    },
  },
});

if (typeof window !== 'undefined' && window.trustedTypes) {
  const existingPolicy = window.trustedTypes.getPolicy?.('mmmk-default');
  if (!existingPolicy) {
    window.trustedTypes.createPolicy('mmmk-default', {
      createHTML: (input) => input,
      createScript: (input) => input,
      createScriptURL: (input) => input,
    });
  }
}

createRoot(document.getElementById('root')).render(
  <>
    <Provider store={store}>
      <AdminAuthProvider>
        <UserAuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </UserAuthProvider>
      </AdminAuthProvider>
    </Provider>
  </>
);
