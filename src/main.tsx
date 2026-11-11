import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setLang, getLang } from './lib/locale';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

setLang(getLang());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
