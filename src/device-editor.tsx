import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { DeviceEditorPage } from './pages/DeviceEditorPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceEditorPage />
  </StrictMode>,
);
