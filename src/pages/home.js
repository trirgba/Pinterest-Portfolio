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
    let imagesQuery;
    if (sectionId === '4') {
      imagesQuery = query(
        collection(db, 'projects', doc.id, 'images'),
        orderBy('order', 'asc')
      );
    } else {
      imagesQuery = query(
        collection(db, 'projects', doc.id, 'images'),
        orderBy('order', 'asc'),
        limit(3)
      );
    }
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
 * Render section 4: Hiển thị tối đa 4 video ngẫu nhiên, chia 4 cột, kèm hover autoplay và nút tới project.
 */
function renderShortsSection(projects, container) {
  container.className = 'shorts-grid'; // Đổi class để dùng CSS 4 cột
  const allShorts = [];

  projects.forEach((project) => {
    if (project.images) {
      project.images.forEach((img) => {
        if (img.type === 'youtube') {
          allShorts.push({
            ...img,
            projectId: project.id,
            projectSlug: project.slug,
            projectName: project.name,
          });
        }
      });
    }
  });

  // Shuffle mảng và lấy tối đa 4 video
  allShorts.sort(() => 0.5 - Math.random());
  const selectedShorts = allShorts.slice(0, 4);

  selectedShorts.forEach((short, index) => {
    const item = document.createElement('div');
    item.className = 'short-item animate-fade-in';
    item.style.animationDelay = `${index * 60}ms`;

    const urlParam = short.projectSlug ? `slug=${short.projectSlug}` : `id=${short.projectId}`;
    const imgSrc = `https://img.youtube.com/vi/${short.youtubeId}/maxresdefault.jpg`;

    // Giao diện: hình ảnh, nút play overlay, nút chuyển tới project
    item.innerHTML = `
      <div class="short-video-container" style="position: relative; width: 100%; aspect-ratio: ${short.isShort ? '9/16' : '16/9'}; border-radius: var(--radius-card); overflow: hidden; cursor: pointer; background: #000;">
        <img src="${imgSrc}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block; position: relative; z-index: 1;">
        <div class="yt-overlay" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2; pointer-events: none;">
          <div style="background: rgba(0,0,0,0.6); border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
        <button class="yt-mute-btn" style="position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; background: rgba(0,0,0,0.6); border-radius: 50%; color: white; border: none; cursor: pointer; z-index: 20; display: none; align-items: center; justify-content: center; pointer-events: auto;">
          <svg class="icon-mute" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
          <svg class="icon-unmute" style="display:none;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        </button>
      </div>
      <a href="/project.html?${urlParam}" class="short-project-btn" style="display: block; margin-top: 12px; padding: 10px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; text-align: center; font-size: 14px; font-weight: 600; color: var(--color-text); text-decoration: none; transition: all var(--transition-fast);">
        Xem Project: ${short.projectName}
      </a>
    `;

    const videoContainer = item.querySelector('.short-video-container');
    const muteBtn = item.querySelector('.yt-mute-btn');
    const iconMute = item.querySelector('.icon-mute');
    const iconUnmute = item.querySelector('.icon-unmute');
    let iframe = null;
    let isMuted = true;
    let hoverTimer;
    let isPlaying = false;
    let isLocked = false;
    const isHoverCapable = window.matchMedia('(hover: hover)').matches;

    const createIframe = () => {
      const el = document.createElement('iframe');
      el.src = `https://www.youtube.com/embed/${short.youtubeId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${short.youtubeId}&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`;
      el.style = 'position: absolute; inset: 0; width: 100%; height: 100%; border: none; z-index: 10; pointer-events: none; transform: scale(1.3);';
      el.allow = 'autoplay; encrypted-media';
      return el;
    };

    const playVideo = () => {
      isPlaying = true;
      muteBtn.style.display = 'flex';
      if (!iframe) {
        iframe = createIframe();
        videoContainer.appendChild(iframe);
      }
    };

    const pauseVideo = () => {
      isPlaying = false;
      muteBtn.style.display = 'none';
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
    };

    if (isHoverCapable) {
      videoContainer.addEventListener('mouseenter', () => {
        if (!isLocked) {
          hoverTimer = setTimeout(playVideo, 300);
        }
      });

      videoContainer.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        if (!isLocked) {
          pauseVideo();
        }
      });
    }

    // Khi click vào video thì toggle play/pause thay vì chuyển tới project (do người dùng muốn thao tác ngay tại home)
    // Wait, the user said "nhấn vào video để play hoặc dùng" (on mobile), but previously videoContainer click went to project page.
    // If videoContainer click is play/pause, they can use the "Xem Project" button to go to project page.
    videoContainer.addEventListener('click', (e) => {
      e.preventDefault();
      isLocked = true;
      if (isPlaying) {
        pauseVideo();
      } else {
        playVideo();
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
      if (iframe) {
        iframe.remove();
        iframe = createIframe();
        videoContainer.appendChild(iframe);
      }
    });

    // Đã xử lý click ở trên, xóa event listener cũ


    container.appendChild(item);
  });
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
      
      if (section.id === '4') {
        renderShortsSection(projects, gridEl);
      } else {
        projects.forEach((project) => {
          gridEl.appendChild(renderProjectCard(project));
        });
      }
    } catch (error) {
      console.error(`Error loading section ${section.id}:`, error);
      // Ẩn section nếu lỗi
      sectionEl.style.display = 'none';
    }
  }
}
