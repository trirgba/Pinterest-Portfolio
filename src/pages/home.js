/**
 * Home Page Logic — Trang chủ
 * Spec Section 5: Project List
 * Fetch projects từ Firestore, render card thumbnail 3:2
 */
import { db } from '../firebase.js';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getOptimizedUrl } from '../cloudinary.js';
import { SITE_CONFIG } from '../config/seo.js';
import { getCurrentUser } from '../auth.js';

/**
 * Fetch tất cả projects và 3 ảnh đầu tiên cho thumbnail
 */
async function fetchProjects() {
  const projectsQuery = query(
    collection(db, 'projects'),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(projectsQuery);
  const projects = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    // Chỉ lấy 3 ảnh đầu tiên cho thumbnail — Spec note 7
    const imagesQuery = query(
      collection(db, 'projects', doc.id, 'images'),
      orderBy('order', 'asc'),
      limit(3)
    );
    const imagesSnap = await getDocs(imagesQuery);
    const images = imagesSnap.docs.map((imgDoc) => ({
      id: imgDoc.id,
      ...imgDoc.data(),
    }));

    projects.push({
      id: doc.id,
      name: data.name,
      order: data.order,
      imageCount: data.imageCount || images.length,
      images,
    });
  }

  return projects;
}

/**
 * Render một project card với thumbnail 3:2
 */
function renderProjectCard(project) {
  const card = document.createElement('a');
  card.href = `/project.html?id=${project.id}`;
  card.className = 'project-card animate-fade-in';
  card.style.animationDelay = `${project.order * 60}ms`;

  const [img1, img2, img3] = project.images;

  const getSeoAlt = (index) => `${project.name} - ${SITE_CONFIG.title} - Ảnh ${index}`;

  card.innerHTML = `
    <div class="project-thumb">
      <div class="thumb-img-large">
        ${img1
          ? `<img src="${getOptimizedUrl(img1.cloudinaryId, { width: 800 })}" alt="${getSeoAlt(1)}" title="${getSeoAlt(1)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
      <div class="thumb-img">
        ${img2
          ? `<img src="${getOptimizedUrl(img2.cloudinaryId, { width: 400 })}" alt="${getSeoAlt(2)}" title="${getSeoAlt(2)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
      <div class="thumb-img">
        ${img3
          ? `<img src="${getOptimizedUrl(img3.cloudinaryId, { width: 400 })}" alt="${getSeoAlt(3)}" title="${getSeoAlt(3)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
    </div>
    <div class="project-info">
      <h3 class="project-name">${project.name}</h3>
      <span class="project-count">${project.imageCount || 0} ảnh</span>
    </div>
  `;

  return card;
}

/**
 * Render loading skeleton
 */
function renderSkeletons(container, count = 8) {
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'project-card-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton" style="aspect-ratio: 3/2;"></div>
      <div style="padding: 12px 0;">
        <div class="skeleton" style="height: 16px; width: 60%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 12px; width: 30%;"></div>
      </div>
    `;
    container.appendChild(skeleton);
  }
}

/**
 * Render empty state
 */
function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon">📸</div>
      <h3>Chưa có project nào</h3>
      <p>Các project sẽ xuất hiện ở đây khi admin thêm mới.</p>
    </div>
  `;
}

/**
 * Initialize trang chủ
 */
export async function initHomePage() {
  const grid = document.getElementById('projects-grid');
  
  // Cập nhật trạng thái nút Login nếu đã đăng nhập
  const loginBtn = document.querySelector('.login-btn');
  getCurrentUser().then(user => {
    if (user && loginBtn) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = '/admin/dashboard.html';
    }
  });

  if (!grid) return;

  // Show loading
  renderSkeletons(grid);

  try {
    const projects = await fetchProjects();
    grid.innerHTML = '';

    if (projects.length === 0) {
      renderEmptyState(grid);
      return;
    }

    projects.forEach((project) => {
      grid.appendChild(renderProjectCard(project));
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Không thể tải dữ liệu</h3>
        <p>Vui lòng thử lại sau.</p>
      </div>
    `;
  }
}
