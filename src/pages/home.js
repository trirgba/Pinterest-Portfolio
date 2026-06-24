/**
 * Home Page Logic — Trang chủ (Multi-Section)
 * Fetch projects theo section từ Firestore, render card thumbnail 3:2
 */
import { db } from '../firebase.js';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { getOptimizedUrl } from '../cloudinary.js';
import { SITE_CONFIG } from '../config/seo.js';
import { getCurrentUser } from '../auth.js';
import { DEFAULT_SECTIONS, fetchSectionNames } from '../config/sections.js';

/**
 * Fetch projects theo section
 * @param {string} sectionId - ID section ("1", "2", ...)
 */
async function fetchProjectsBySection(sectionId) {
  let projectsQuery;

  if (sectionId === '1') {
    // Section 1: lấy cả project cũ không có field section (backward compat)
    // Firestore không hỗ trợ OR query dễ dàng nên ta fetch tất cả rồi filter
    const allQuery = query(
      collection(db, 'projects'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(allQuery);
    const projects = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      // Section 1 = project có section === "1" hoặc không có field section
      if (data.section && data.section !== '1') continue;

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
        slug: data.slug,
        order: data.order,
        excerpt: data.excerpt || '',
        imageCount: data.imageCount || images.length,
        images,
      });
    }

    return projects;
  }

  // Các section khác: query chính xác
  projectsQuery = query(
    collection(db, 'projects'),
    where('section', '==', sectionId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(projectsQuery);
  const projects = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
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
      slug: data.slug,
      order: data.order,
      excerpt: data.excerpt || '',
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
  const urlParam = project.slug ? `slug=${project.slug}` : `id=${project.id}`;
  const card = document.createElement('a');
  card.href = `/project.html?${urlParam}`;
  card.className = 'project-card animate-fade-in';
  card.style.animationDelay = `${project.order * 60}ms`;

  const [img1, img2, img3] = project.images;

  const getSeoAlt = (index) => `${project.name} - ${SITE_CONFIG.title} - Ảnh ${index}`;
  const getMediaUrl = (media, width) => media.type === 'youtube' ? `https://img.youtube.com/vi/${media.youtubeId}/maxresdefault.jpg` : getOptimizedUrl(media.cloudinaryId, { width });

  card.innerHTML = `
    <div class="project-thumb">
      <div class="thumb-img-large">
        ${img1
          ? `<img src="${getMediaUrl(img1, 800)}" alt="${getSeoAlt(1)}" title="${getSeoAlt(1)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
      <div class="thumb-img">
        ${img2
          ? `<img src="${getMediaUrl(img2, 400)}" alt="${getSeoAlt(2)}" title="${getSeoAlt(2)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
      <div class="thumb-img">
        ${img3
          ? `<img src="${getMediaUrl(img3, 400)}" alt="${getSeoAlt(3)}" title="${getSeoAlt(3)}" loading="lazy">`
          : '<div class="thumb-placeholder"></div>'
        }
      </div>
    </div>
    <div class="project-info">
      <h3 class="project-name">${project.name}</h3>
      ${project.excerpt ? `<p class="project-excerpt">${project.excerpt}</p>` : ''}
    </div>
  `;

  return card;
}

/**
 * Render loading skeleton
 */
function renderSkeletons(container, count = 3) {
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
 * Initialize trang chủ — multi-section
 */
export async function initHomePage() {
  // Cập nhật trạng thái nút Login nếu đã đăng nhập
  const loginBtn = document.querySelector('.login-btn');
  getCurrentUser().then(user => {
    if (user && loginBtn) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = '/admin/dashboard.html';
    }
  });

  // Fetch tên sections từ Firestore
  const sections = await fetchSectionNames();

  // Loop qua từng section
  for (const section of sections) {
    const sectionEl = document.getElementById(`section-${section.id}`);
    const titleEl = document.getElementById(`section-title-${section.id}`);
    const gridEl = document.getElementById(`projects-grid-${section.id}`);

    if (!sectionEl || !gridEl) continue;

    // Set section title
    if (titleEl) titleEl.textContent = section.name;

    // Show skeleton trong khi loading
    renderSkeletons(gridEl);

    try {
      const projects = await fetchProjectsBySection(section.id);

      gridEl.innerHTML = '';

      if (projects.length === 0) {
        // Ẩn section nếu không có project
        sectionEl.style.display = 'none';
        continue;
      }

      // Hiện section và render cards
      sectionEl.style.display = '';
      projects.forEach((project) => {
        gridEl.appendChild(renderProjectCard(project));
      });
    } catch (error) {
      console.error(`Error loading section ${section.id}:`, error);
      // Ẩn section nếu lỗi
      sectionEl.style.display = 'none';
    }
  }
}
