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
 * Tính toán số cột: 2 ảnh ngang nằm kề nhau sẽ được nhóm lại, mỗi ảnh chiếm 2 cột
 */
function calculateMasonryColSpans(images) {
  const colSpans = new Array(images.length).fill(1);
  const isLandscape = (img) => img.width && img.height && (img.width / img.height >= 1.3);

  for (let i = 0; i < images.length; i++) {
    if (colSpans[i] === 2) continue; // Đã được nhóm
    
    if (isLandscape(images[i])) {
      // Kiểm tra ảnh tiếp theo
      if (i + 1 < images.length && isLandscape(images[i + 1])) {
        colSpans[i] = 2;
        colSpans[i + 1] = 2;
      }
    }
  }
  return colSpans;
}

/**
 * Đo chiều cao thực tế để chia dòng chính xác trong CSS Grid (grid-auto-rows: 10px)
 */
function calculateMasonryRowSpans(container) {
  const computedStyle = window.getComputedStyle(container);
  const gap = parseInt(computedStyle.rowGap) || 16;
  const rowHeight = 10;

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
  const colSpans = calculateMasonryColSpans(images);

  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'mosaic-item animate-fade-in';
    item.style.animationDelay = `${index * 40}ms`;
    item.dataset.index = index;

    // Cấp phát cột theo kết quả ghép đôi
    item.style.gridColumn = `span ${colSpans[index]}`;

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
      
      // Tính chiều cao sau khi render
      calculateMasonryRowSpans(grid);
      
      // Lắng nghe resize để tính lại
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
