/**
 * Project Detail Page — Mosaic Grid
 * Spec Section 6: Dynamic Mosaic Grid
 * CSS Grid + grid-auto-flow: dense + JS span calculator
 */
import { db } from '../firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { getOptimizedUrl } from '../cloudinary.js';
import { SITE_CONFIG } from '../config/seo.js';

/**
 * Xác định số cột (colSpan) dựa trên tỷ lệ ảnh
 */
function calculateColSpan(width, height) {
  const ratio = width / height;
  if (ratio >= 1.3) {
    return 2; // Hình ngang chiếm 2 cột
  }
  return 1;
}

/**
 * Tính toán chiều cao thực tế để cấp phát số lượng row (Row Spans)
 * Sử dụng grid-auto-rows: 10px để tính chính xác mà không bị cắt ảnh
 */
function calculateMasonryRowSpans(container) {
  const computedStyle = window.getComputedStyle(container);
  const gap = parseInt(computedStyle.rowGap) || 16;
  const rowHeight = 10; // Khớp với grid-auto-rows: 10px trong grid.css

  const items = container.querySelectorAll('.mosaic-item');

  items.forEach((item) => {
    const imgEl = item.querySelector('img');
    if (!imgEl) return;

    const setSpan = () => {
      const height = imgEl.getBoundingClientRect().height;
      const rowSpan = Math.ceil((height + gap) / (rowHeight + gap));
      item.style.gridRowEnd = `span ${rowSpan}`;
    };

    if (imgEl.complete) {
      setSpan();
    } else {
      imgEl.addEventListener('load', setSpan);
    }
  });
}

/**
 * Fetch project info + tất cả images
 */
async function fetchProjectDetail(projectId) {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error('Project không tồn tại');
  }

  const projectData = projectSnap.data();

  const imagesQuery = query(
    collection(db, 'projects', projectId, 'images'),
    orderBy('order', 'asc')
  );
  const imagesSnap = await getDocs(imagesQuery);
  const images = imagesSnap.docs.map((imgDoc) => ({
    id: imgDoc.id,
    ...imgDoc.data(),
  }));

  return {
    id: projectId,
    ...projectData,
    images,
  };
}

/**
 * Render mosaic grid
 */
function renderMosaicGrid(images, container) {
  container.innerHTML = '';

  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'mosaic-item animate-fade-in';
    item.style.animationDelay = `${index * 40}ms`;
    item.dataset.index = index;

    // Apply colSpan for dense grid
    if (img.width && img.height) {
      const colSpan = calculateColSpan(img.width, img.height);
      item.style.gridColumn = `span ${colSpan}`;
    }

    // Lấy tiêu đề dự án để làm SEO, lấy fallback từ biến toàn cục nếu chưa có
    const projectName = document.getElementById('project-title')?.textContent || 'Project';
    const seoAlt = `${projectName} - ${SITE_CONFIG.title} - Ảnh ${index + 1}`;

    item.innerHTML = `<img src="${getOptimizedUrl(img.cloudinaryId, { width: 800 })}" alt="${seoAlt}" title="${seoAlt}" loading="lazy">`;

    // Click to open lightbox
    item.addEventListener('click', () => openLightbox(images, index));

    container.appendChild(item);
  });
}

/**
 * Lightbox — xem ảnh full screen
 */
let currentLightboxIndex = 0;
let lightboxImages = [];

function openLightbox(images, index) {
  lightboxImages = images;
  currentLightboxIndex = index;

  const overlay = document.getElementById('lightbox');
  const img = overlay.querySelector('img');

  // Lightbox dùng ảnh to hơn nhưng vẫn ép sang WebP
  img.src = getOptimizedUrl(images[index].cloudinaryId, { width: 1600 });
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = lightboxImages.length - 1;
  if (currentLightboxIndex >= lightboxImages.length) currentLightboxIndex = 0;

  const overlay = document.getElementById('lightbox');
  const img = overlay.querySelector('img');
  img.src = getOptimizedUrl(lightboxImages[currentLightboxIndex].cloudinaryId, { width: 1600 });
}

/**
 * Render loading skeletons cho mosaic
 */
function renderMosaicSkeletons(container) {
  const heights = [200, 300, 250, 180, 320, 220, 280, 240];

  heights.forEach((h) => {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton';
    skeleton.style.height = `${h}px`;
    skeleton.style.marginBottom = 'var(--global-gap, 16px)';
    skeleton.style.breakInside = 'avoid';
    container.appendChild(skeleton);
  });
}

/**
 * Initialize project detail page
 */
export async function initProjectPage() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    window.location.href = '/';
    return;
  }

  const titleEl = document.getElementById('project-title');
  const countEl = document.getElementById('project-count');
  const grid = document.getElementById('mosaic-grid');
  const backBtn = document.getElementById('back-btn');

  // Loading
  if (grid) renderMosaicSkeletons(grid);

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });
  }

  // Lightbox setup
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  try {
    const project = await fetchProjectDetail(projectId);

    if (titleEl) titleEl.textContent = project.name;
    if (countEl) countEl.textContent = `${project.images.length} ảnh`;

    if (grid && project.images.length > 0) {
      renderMosaicGrid(project.images, grid);
      
      // Kích hoạt tính toán chiều cao masonry sau khi render
      calculateMasonryRowSpans(grid);
      
      // Lắng nghe sự kiện resize để tính lại chiều cao khi kích thước màn hình thay đổi
      window.addEventListener('resize', () => {
        calculateMasonryRowSpans(grid);
      });
      
    } else if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="icon">🖼️</div>
          <h3>Chưa có ảnh nào</h3>
          <p>Project này chưa được thêm ảnh.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading project:', error);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="icon">⚠️</div>
          <h3>Không thể tải project</h3>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
