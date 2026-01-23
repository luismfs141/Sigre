import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api'; // 👈 1. Importar el Provider

import App from './App';
import "primereact/resources/themes/lara-light-cyan/theme.css"; // TEMA
import "primereact/resources/primereact.min.css";               // CORE
import "primeicons/primeicons.css";
// ESTILOS
import './index.css';    // 👈 2. Tus variables globales (Tailwind) van primero
import './styles/prime'; // 👈 3. Los estilos de Prime + tu Override van después

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

root.render(
  /* 4. Envolver la App con el Provider */
  <PrimeReactProvider>
    <Router>
      <App />
    </Router>
  </PrimeReactProvider>
);