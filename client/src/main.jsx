import React from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <MotionConfig transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
    <App />
  </MotionConfig>
);
