/**
 * Entry Point — Main JS
 * Import styles and initialize app
 */
import './styles/main.css';
import './styles/grid.css';
import { injectSEO } from './config/seo.js';

// Tự động chèn SEO Meta và Schema JSON-LD cho toàn bộ các trang
injectSEO();

// Hiệu ứng dot grid tương tác
document.addEventListener('DOMContentLoaded', () => {
  const dotLayer = document.createElement('div');
  dotLayer.id = 'dot-cursor-layer';
  Object.assign(dotLayer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '0',
    backgroundImage: 'radial-gradient(circle, rgb(0, 0, 0) 0.8px, transparent 0.8px)',
    backgroundSize: '10px 10px',
    backgroundPosition: '5px 5px',
    webkitMaskImage: 'radial-gradient(120px circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black, transparent)',
    maskImage: 'radial-gradient(120px circle at var(--cursor-x, -100%) var(--cursor-y, -100%), black, transparent)',
    opacity: '0.4', // Chỉnh độ đậm của dot
  });
  document.body.appendChild(dotLayer);

  document.addEventListener('mousemove', (e) => {
    dotLayer.style.setProperty('--cursor-x', `${e.clientX}px`);
    dotLayer.style.setProperty('--cursor-y', `${e.clientY}px`);
  });
});
