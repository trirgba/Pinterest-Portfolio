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
export function layoutJustifiedGrid(images, container, options = {}) {
  const containerWidth = container.clientWidth;
  if (!containerWidth) return;

  const gap = 16;
  const section = options.section || null;
  // Section 4: targetHeight thấp hơn để 4 video shorts (9:16) vừa 1 hàng
  let targetHeight = window.innerWidth <= 768 ? 150 : 300;
  if (section === '4') {
    targetHeight = window.innerWidth <= 768 ? 180 : 420;
  }
  
  let currentRow = [];
  let currentRowWidth = 0;
  
  const itemElements = Array.from(container.children);

  const processRow = (row, rowWidth, forceFullWidth) => {
    if (row.length === 0) return;
    const gapsWidth = (row.length - 1) * gap;
    const availableWidth = containerWidth - gapsWidth;
    // Stretch to full width
    const scale = availableWidth / rowWidth;
    const finalHeight = targetHeight * scale;

    row.forEach((rowItem) => {
      const itemWidth = rowItem.ratio * finalHeight;
      rowItem.el.style.width = `${itemWidth}px`;
      rowItem.el.style.height = `${finalHeight}px`;
    });
  };

  images.forEach((img, index) => {
    let ratio = 1;
    if (img.width && img.height) {
      ratio = img.width / img.height;
    } else if (img.type === 'youtube') {
      ratio = img.isShort ? (9 / 16) : (16 / 9);
    }
    const itemWidthAtTarget = ratio * targetHeight;

    if (img.isFullWidth) {
      // Process current row first
      processRow(currentRow, currentRowWidth, false);
      currentRow = [];
      currentRowWidth = 0;

      // Make this image full width
      const el = itemElements[index];
      const finalHeight = containerWidth / ratio;
      el.style.width = `${containerWidth}px`;
      el.style.height = `${finalHeight}px`;
    } else {
      if (currentRow.length > 0 && currentRowWidth + itemWidthAtTarget + (currentRow.length * gap) > containerWidth) {
        processRow(currentRow, currentRowWidth, false);
        currentRow = [];
        currentRowWidth = 0;
      }
      currentRow.push({ ratio, el: itemElements[index] });
      currentRowWidth += itemWidthAtTarget;
    }
  });

  // Xử lý hàng cuối cùng (kéo căng full dòng theo yêu cầu mới)
  processRow(currentRow, currentRowWidth, false);
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
function renderMosaicGrid(images, container, options = {}) {
  container.innerHTML = '';

  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'mosaic-item animate-fade-in';
    item.style.animationDelay = `${index * 40}ms`;
    item.dataset.index = index;

    // Lấy tiêu đề dự án để làm SEO, lấy fallback từ biến toàn cục nếu chưa có
    const projectName = document.getElementById('project-title')?.textContent || 'Project';
    const seoAlt = `${projectName} - ${SITE_CONFIG.title} - Ảnh ${index + 1}`;

    const isYt = img.type === 'youtube';
    const imgSrc = isYt 
      ? `https://img.youtube.com/vi/${img.youtubeId}/maxresdefault.jpg`
      : getOptimizedUrl(img.cloudinaryId, { width: 800 });

    const ytOverlay = isYt 
      ? `<div class="yt-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 2;"><svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>
         <button class="yt-mute-btn" style="position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; background: rgba(0,0,0,0.6); border-radius: 50%; color: white; border: none; cursor: pointer; z-index: 20; display: none; align-items: center; justify-content: center;">
           <svg class="icon-mute" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
           <svg class="icon-unmute" style="display:none;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
         </button>`
      : '';

    item.innerHTML = `
      <img src="${imgSrc}" alt="${seoAlt}" title="${seoAlt}" loading="lazy" style="position: relative; z-index: 1;">
      ${ytOverlay}
    `;

    if (isYt) {
      let iframe = null;
      let isMuted = true;
      const muteBtn = item.querySelector('.yt-mute-btn');
      const iconMute = item.querySelector('.icon-mute');
      const iconUnmute = item.querySelector('.icon-unmute');
      
      let hoverTimer;

      const createIframe = () => {
        const el = document.createElement('iframe');
        el.src = `https://www.youtube.com/embed/${img.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${img.youtubeId}`;
        el.style = 'position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 10; pointer-events: none;';
        el.allow = 'autoplay; encrypted-media';
        return el;
      };

      item.addEventListener('mouseenter', () => {
        muteBtn.style.display = 'flex';
        hoverTimer = setTimeout(() => {
          if (!iframe) {
            iframe = createIframe();
            item.appendChild(iframe);
          }
        }, 300);
      });

      item.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        muteBtn.style.display = 'none';
        if (iframe) {
          iframe.remove();
          iframe = null;
        }
      });

      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isMuted = !isMuted;
        if (isMuted) {
          iconMute.style.display = 'block';
          iconUnmute.style.display = 'none';
        } else {
          iconMute.style.display = 'none';
          iconUnmute.style.display = 'block';
        }
        // Tạo lại iframe với tham số mute mới
        if (iframe) {
          iframe.remove();
          iframe = createIframe();
          item.appendChild(iframe);
        }
      });
    }

    // Click to open lightbox
    item.addEventListener('click', () => openLightbox(images, index));

    container.appendChild(item);
  });

  // Calculate layout using RequestAnimationFrame to ensure container has width
  requestAnimationFrame(() => {
    layoutJustifiedGrid(images, container, options);
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
  const iframe = document.getElementById('lightbox-iframe');

  const media = images[index];

  if (media.type === 'youtube') {
    img.style.display = 'none';
    iframe.style.display = 'block';
    iframe.src = `https://www.youtube.com/embed/${media.youtubeId}?autoplay=1`;
    // Điều chỉnh kích thước lightbox theo tỉ lệ video
    if (media.isShort) {
      iframe.style.width = '45vh';
      iframe.style.maxWidth = '405px';
      iframe.style.height = '80vh';
      iframe.style.maxHeight = '720px';
    } else {
      iframe.style.width = '80vw';
      iframe.style.maxWidth = '1280px';
      iframe.style.height = '80vh';
      iframe.style.maxHeight = '720px';
    }
  } else {
    iframe.style.display = 'none';
    iframe.src = '';
    img.style.display = 'block';
    
    // Reset animation
    img.style.animation = 'none';
    void img.offsetHeight;
    img.style.animation = '';
    img.src = getOptimizedUrl(media.cloudinaryId, { width: 1600 });
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox');
  const img = overlay.querySelector('img');
  const iframe = document.getElementById('lightbox-iframe');
  
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  iframe.src = '';
}

function navigateLightbox(direction) {
  currentLightboxIndex += direction;
  if (currentLightboxIndex < 0) currentLightboxIndex = lightboxImages.length - 1;
  if (currentLightboxIndex >= lightboxImages.length) currentLightboxIndex = 0;

  openLightbox(lightboxImages, currentLightboxIndex);
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
      const gridOptions = { section: project.section };
      renderMosaicGrid(project.images, grid, gridOptions);
      
      // Lắng nghe resize với debounce để tránh giật lag
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          layoutJustifiedGrid(project.images, grid, gridOptions);
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
