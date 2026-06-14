/**
 * Entry Point — Main JS
 * Import styles and initialize app
 */
import './styles/main.css';
import './styles/grid.css';
import { injectSEO } from './config/seo.js';

import { initDotGrid } from './utils/dotGrid.js';

// Tự động chèn SEO Meta và Schema JSON-LD cho toàn bộ các trang
injectSEO();

// Hiệu ứng dot grid tương tác
initDotGrid();
