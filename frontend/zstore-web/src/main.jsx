
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CarritoProvider } from './context/CarritoProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CarritoProvider>
        <App />
      </CarritoProvider>
    </QueryClientProvider>
  </StrictMode>,
);
