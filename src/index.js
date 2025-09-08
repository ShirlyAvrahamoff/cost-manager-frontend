// src/index.js
/**
 * Entry point of the React application.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);
