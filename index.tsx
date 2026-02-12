
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Use ESM URL for react-router-dom to resolve "no exported member" errors in browser-based ESM environments.
import { HashRouter } from 'https://esm.sh/react-router-dom@6';
// Fix: Correct path to App component which is located in the components directory.
import App from './components/App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
