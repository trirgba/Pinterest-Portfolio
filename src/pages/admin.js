/**
 * Admin Dashboard Logic
 * Spec Section 7: CRUD Projects, Upload, Drag & Drop
 */
import { db, auth } from '../firebase.js';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary.js';
import { getCurrentUser, logout, onAuthChange } from '../auth.js';
import Sortable from 'sortablejs';

let currentUser = null;
let selectedProjectId = null;

/**
 * Toast notification
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  document.querySelectorAll('.toast').forEach((t) => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
// PROJECTS CRUD
// ==========================================

/**
 * Fetch all projects
 */
async function fetchProjects() {
  const q = query(collection(db, 'projects'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create new project
 */
async function createProject(name) {
  const projects = await fetchProjects();
  const order = projects.length;

  await addDoc(collection(db, 'projects'), {
    name,
    order,
    createdAt: serverTimestamp(),
  });

  showToast(`Đã tạo project "${name}"`, 'success');
  await renderProjectList();
}

/**
 * Delete project và toàn bộ images
 */
async function deleteProject(projectId) {
  if (!confirm('Xoá project này? Hành động không thể hoàn tác.')) return;

  try {
    // Xoá images trên Cloudinary trước
    const imagesSnap = await getDocs(collection(db, 'projects', projectId, 'images'));
    const idToken = await currentUser.getIdToken();

    for (const imgDoc of imagesSnap.docs) {
      const imgData = imgDoc.data();
      try {
        await deleteFromCloudinary(imgData.cloudinaryId, idToken);
      } catch (e) {
        console.warn('Failed to delete from Cloudinary:', e);
      }
      await deleteDoc(doc(db, 'projects', projectId, 'images', imgDoc.id));
    }

    // Xoá project document
    await deleteDoc(doc(db, 'projects', projectId));
    showToast('Đã xoá project', 'success');
    selectedProjectId = null;
    await renderProjectList();
    hideProjectDetail();
  } catch (error) {
    console.error('Error deleting project:', error);
    showToast('Lỗi khi xoá project', 'error');
  }
}

// ==========================================
// IMAGES
// ==========================================

/**
 * Fetch images of a project
 */
async function fetchImages(projectId) {
  const q = query(
    collection(db, 'projects', projectId, 'images'),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Upload multiple images
 */
async function uploadImages(projectId, files) {
  const progressContainer = document.getElementById('upload-progress');
  if (progressContainer) progressContainer.innerHTML = '';

  let successCount = 0;
  const existingImages = await fetchImages(projectId);
  let nextOrder = existingImages.length;

  for (const file of files) {
    const progressItem = document.createElement('div');
    progressItem.className = 'upload-progress-item';
    progressItem.innerHTML = `
      <span>${file.name}</span>
      <div class="upload-progress-bar"><div class="fill" style="width: 0%"></div></div>
    `;
    if (progressContainer) progressContainer.appendChild(progressItem);

    try {
      const fill = progressItem.querySelector('.fill');
      if (fill) fill.style.width = '50%';

      const result = await uploadToCloudinary(file);

      // Lưu vào Firestore
      await addDoc(collection(db, 'projects', projectId, 'images'), {
        cloudinaryId: result.cloudinaryId,
        url: result.url,
        width: result.width,
        height: result.height,
        order: nextOrder++,
        createdAt: serverTimestamp(),
      });

      if (fill) fill.style.width = '100%';
      successCount++;
    } catch (error) {
      console.error('Upload failed:', file.name, error);
      progressItem.style.color = 'var(--color-danger)';
    }
  }

  showToast(`Đã upload ${successCount}/${files.length} ảnh`, 'success');
  await renderProjectDetail(projectId);
}

/**
 * Delete a single image
 */
async function deleteImage(projectId, imageId, cloudinaryId) {
  if (!confirm('Xoá ảnh này?')) return;

  try {
    const idToken = await currentUser.getIdToken();
    try {
      await deleteFromCloudinary(cloudinaryId, idToken);
    } catch (e) {
      console.warn('Failed to delete from Cloudinary:', e);
    }

    await deleteDoc(doc(db, 'projects', projectId, 'images', imageId));

    // Cập nhật lại order
    const images = await fetchImages(projectId);
    const batch = writeBatch(db);
    images.forEach((img, index) => {
      const ref = doc(db, 'projects', projectId, 'images', img.id);
      batch.update(ref, { order: index });
    });
    await batch.commit();

    showToast('Đã xoá ảnh', 'success');
    await renderProjectDetail(projectId);
  } catch (error) {
    console.error('Error deleting image:', error);
    showToast('Lỗi khi xoá ảnh', 'error');
  }
}

// ==========================================
// RENDERING
// ==========================================

/**
 * Render danh sách projects
 */
async function renderProjectList() {
  const container = document.getElementById('project-list');
  if (!container) return;

  container.innerHTML = '<div class="skeleton" style="height: 200px;"></div>';

  try {
    const projects = await fetchProjects();
    container.innerHTML = '';

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📁</div>
          <h3>Chưa có project</h3>
          <p>Bấm "Tạo project" để bắt đầu.</p>
        </div>
      `;
      return;
    }

    projects.forEach((project) => {
      const card = document.createElement('div');
      card.className = 'project-card-admin animate-fade-in';
      card.innerHTML = `
        <div class="project-card-admin-thumb">
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-subtle); font-size: 32px;">📁</div>
        </div>
        <div class="project-card-admin-body">
          <h3>${project.name}</h3>
          <span class="meta">Thứ tự: ${project.order}</span>
        </div>
        <div class="project-card-admin-actions">
          <button class="btn-secondary btn-sm view-btn" data-id="${project.id}">Xem & Quản lý</button>
          <button class="btn-icon danger delete-btn" data-id="${project.id}" title="Xoá project">🗑️</button>
        </div>
      `;

      card.querySelector('.view-btn').addEventListener('click', () => {
        selectedProjectId = project.id;
        renderProjectDetail(project.id);
      });

      card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteProject(project.id);
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">⚠️</div>
        <h3>Lỗi tải dữ liệu</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/**
 * Render chi tiết project — image grid + drag & drop
 */
async function renderProjectDetail(projectId) {
  const detailSection = document.getElementById('project-detail');
  if (!detailSection) return;

  detailSection.style.display = 'block';

  const projectSnap = await getDoc(doc(db, 'projects', projectId));
  if (!projectSnap.exists()) return;

  const project = { id: projectId, ...projectSnap.data() };
  const images = await fetchImages(projectId);

  document.getElementById('detail-project-name').textContent = project.name;
  document.getElementById('detail-image-count').textContent = `${images.length} ảnh`;

  const imageGrid = document.getElementById('admin-image-grid');
  imageGrid.innerHTML = '';

  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'admin-image-item';
    item.dataset.id = img.id;
    item.innerHTML = `
      <img src="${img.url}" alt="Image ${index + 1}" loading="lazy">
      <span class="order-badge">${index}</span>
      <button class="delete-btn" title="Xoá ảnh">✕</button>
    `;

    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteImage(projectId, img.id, img.cloudinaryId);
    });

    imageGrid.appendChild(item);
  });

  // Init SortableJS — Spec Section 7
  if (imageGrid._sortable) imageGrid._sortable.destroy();
  imageGrid._sortable = Sortable.create(imageGrid, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async () => {
      const items = imageGrid.querySelectorAll('.admin-image-item');
      const batch = writeBatch(db);

      items.forEach((item, index) => {
        const imgId = item.dataset.id;
        const ref = doc(db, 'projects', projectId, 'images', imgId);
        batch.update(ref, { order: index });
        // Update badge
        item.querySelector('.order-badge').textContent = index;
      });

      await batch.commit();
      showToast('Đã cập nhật thứ tự ảnh', 'success');
    },
  });
}

function hideProjectDetail() {
  const detailSection = document.getElementById('project-detail');
  if (detailSection) detailSection.style.display = 'none';
}

// ==========================================
// MODAL
// ==========================================

function setupCreateModal() {
  const openBtn = document.getElementById('btn-create-project');
  const modal = document.getElementById('modal-create');
  const cancelBtn = document.getElementById('modal-cancel');
  const form = document.getElementById('form-create-project');

  if (!openBtn || !modal) return;

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.getElementById('input-project-name').focus();
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('input-project-name').value.trim();
    if (!name) return;

    await createProject(name);
    document.getElementById('input-project-name').value = '';
    modal.classList.remove('active');
  });
}

// ==========================================
// UPLOAD
// ==========================================

function setupUpload() {
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (!uploadZone || !fileInput) return;

  uploadZone.addEventListener('click', () => fileInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (!selectedProjectId) {
      showToast('Vui lòng chọn project trước', 'error');
      return;
    }
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) uploadImages(selectedProjectId, files);
  });

  fileInput.addEventListener('change', (e) => {
    if (!selectedProjectId) {
      showToast('Vui lòng chọn project trước', 'error');
      return;
    }
    const files = Array.from(e.target.files);
    if (files.length > 0) uploadImages(selectedProjectId, files);
    fileInput.value = '';
  });
}

// ==========================================
// INIT
// ==========================================

export async function initAdminPage() {
  // Check auth
  onAuthChange((user) => {
    if (!user) {
      window.location.href = '/admin/login.html';
      return;
    }
    currentUser = user;

    // Update header user info
    const userInfo = document.getElementById('admin-user-info');
    if (userInfo) {
      userInfo.innerHTML = `
        <span>${user.displayName || user.email}</span>
        ${user.photoURL ? `<img src="${user.photoURL}" alt="avatar">` : ''}
      `;
    }
  });

  // Wait for auth
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = '/admin/login.html';
    return;
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.href = '/admin/login.html';
    });
  }

  // Back to list button
  const backToListBtn = document.getElementById('btn-back-to-list');
  if (backToListBtn) {
    backToListBtn.addEventListener('click', () => {
      hideProjectDetail();
    });
  }

  setupCreateModal();
  setupUpload();
  await renderProjectList();
}
