import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.requestAnimationFrame(() => {
  setTimeout(() => {
    const splash = document.getElementById('yoha-splash');
    if (splash) splash.classList.add('hide');
    setTimeout(() => splash?.remove(), 800);
  }, 1400);
});
