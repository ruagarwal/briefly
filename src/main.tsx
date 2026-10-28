/**
 * @file main.tsx
 * @module main
 * @description
 * Client application bootstrap and DOM entry point for Briefly.
 * Renders the top-level <App /> component into the '#root' container.
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
