import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import './index.css';
import { router } from './router';
import { CloudRoomProvider } from './cloud/CloudRoomProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudRoomProvider>
      <RouterProvider router={router} />
    </CloudRoomProvider>
    <Toaster position="top-center" richColors />
  </StrictMode>,
);
