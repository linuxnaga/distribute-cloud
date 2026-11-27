import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { GameProvider } from './state/GameContext.jsx';
import { ReferenceProvider } from './state/ReferenceContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <ReferenceProvider>
        <App />
      </ReferenceProvider>
    </GameProvider>
  </StrictMode>,
);
