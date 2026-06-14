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
  where,
  limit,
} from 'firebase/firestore';
import { getOptimizedUrl } from '../cloudinary.js';
import { SITE_CONFIG } from '../config/seo.js';
import { getCurrentUser } from '../auth.js';


/**
 * Thuật toán Justified Image Grid (Phong cách Behance/Flickr)
 */
export function layoutJustifiedGrid(images, container) {
  const containerWidth = container.clientWidth;
  if (!containerWidth) return;

  const gap = 16;
  const targetHeight = window.innerWidth <= 768 ? 150 : 300;
  
  let currentRow = [];
  let currentRowWidth = 0;
  
  const itemElements = Array.from(container.children);

  images.forEach((img, index) => {
    // Lấy tỷ lệ từ dữ liệu, fallback 1:1 nếu thiếu
    const ratio = (img.width && img.height) ? (img.width / img.height) : 1;
    const itemWidthAtTarget = ratio * targetHeight;

    if (currentRow.length > 0 && currentRowWidth + itemWidthAtTarget + (currentRow.length * gap) > containerWidth) {
      // Hàng đã đầy, tính scale factor để kéo căng ra cho khít 100% chiều rộng
      const gapsWidth = (currentRow.length - 1) * gap;
      const availableWidth = containerWidth - gapsWidth;
      const scale = availableWidth / currentRowWidth;
      const finalHeight = targetHeight * scale;

      currentRow.forEach((rowItem) => {
        const itemWidth = rowItem.ratio * finalHeight;
        rowItem.el.style.width = `${itemWidth}px`;
        rowItem.el.style.height = `${finalHeight}px`;
      });

      // Bắt đầu hàng mới
      currentRow = [];
      currentRowWidth = 0;
    }

    currentRow.push({ ratio, el: itemElements[index] });
    currentRowWidth += itemWidthAtTarget;
  });

  // Xử lý hàng cuối cùng (không kéo căng để tránh ảnh bị phóng quá to)
  if (currentRow.length > 0) {
    currentRow.forEach((rowItem) => {
      const itemWidth = rowItem.ratio * targetHeight;
      rowItem.el.style.width = `${itemWidth}px`;
      rowItem.el.style.height = `${targetHeight}px`;
    });
  }
}

/**
 * Fetch project info + tất cả images
 */
async function fetchProjectDetail(projectIdOrSlug) {
  let projectSnap = null;
  let projectId = projectIdOrSlug;

  try {
    projectSnap = await getDoc(doc(db, 'projects', projectIdOrSlug));
  } catch (e) {
    // Ignore invalid doc id errors
  }

  if (!projectSnap || !projectSnap.exists()) {
    const q = query(collection(db, 'projects'), where('slug', '==', projectIdOrSlug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      projectSnap = snap.docs[0];
      projectId = projectSnap.id;
    } else {
      throw new Error('Project không tồn tại');
    }
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

    // Lấy tiêu đề dự án để làm SEO, lấy fallback từ biến toàn cục nếu chưa có
    const projectName = document.getElementById('project-title')?.textContent || 'Project';
    const seoAlt = `${projectName} - ${SITE_CONFIG.title} - Ảnh ${index + 1}`;

    item.innerHTML = `<img src="${getOptimizedUrl(img.cloudinaryId, { width: 800 })}" alt="${seoAlt}" title="${seoAlt}" loading="lazy">`;

    // Click to open lightbox
    item.addEventListener('click', () => openLightbox(images, index));

    container.appendChild(item);
  });

  // Calculate layout using RequestAnimationFrame to ensure container has width
  requestAnimationFrame(() => {
    layoutJustifiedGrid(images, container);
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

  // Reset animation để zoom-in chạy lại mỗi lần mở
  img.style.animation = 'none';
  // Force reflow
  void img.offsetHeight;
  img.style.animation = '';

  // Lightbox dùng ảnh to hơn nhưng vẫn ép sang WebP
  img.src = getOptimizedUrl(images[index].cloudinaryId, { width: 1600 });
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  const img = overlay.querySelector('img');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Xoá src để tránh flash ảnh cũ khi mở lại
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
  const projectIdOrSlug = params.get('slug') || params.get('id');

  if (!projectIdOrSlug) {
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
    const project = await fetchProjectDetail(projectIdOrSlug);

    if (titleEl) titleEl.textContent = project.name;
    if (countEl) countEl.textContent = `/ ${project.images.length} ảnh`;

    // Check admin and show edit button
    const user = await getCurrentUser();
    const editBtn = document.getElementById('edit-project-btn');
    if (user && editBtn) {
      editBtn.style.display = 'flex';
      editBtn.href = `/admin/dashboard.html?edit=${project.id}`;
      editBtn.target = '_blank';
    }

    if (grid && project.images.length > 0) {
      renderMosaicGrid(project.images, grid);
      
      // Lắng nghe resize với debounce để tránh giật lag
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          layoutJustifiedGrid(project.images, grid);
        }, 100);
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
