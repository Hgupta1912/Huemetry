import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import routes from './routes.tsx';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);