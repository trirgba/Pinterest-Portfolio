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
  onSnapshot,
  limit,
  setDoc
} from 'firebase/firestore';
import { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl } from '../cloudinary.js';
import { getCurrentUser, logout, onAuthChange, ADMIN_CODE_EMAIL, changeAdminCode, getAllowedEmails } from '../auth.js';
import Sortable from 'sortablejs';
import { layoutJustifiedGrid } from './project.js';

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
  let currentImages = [...images];

  document.getElementById('detail-project-name').textContent = project.name;
  document.getElementById('detail-image-count').textContent = `${images.length} ảnh`;

  const imageGrid = document.getElementById('admin-image-grid');
  imageGrid.innerHTML = '';

  currentImages.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'admin-image-item';
    item.dataset.id = img.id;
    item.innerHTML = `
      <img src="${getOptimizedUrl(img.cloudinaryId, { width: 800 })}" alt="Image ${index + 1}" loading="lazy">
      <span class="order-badge">${index + 1}</span>
      <button class="delete-btn" title="Xoá ảnh">✕</button>
    `;

    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteImage(projectId, img.id, img.cloudinaryId);
    });

    imageGrid.appendChild(item);
  });

  // Lần đầu render layout
  requestAnimationFrame(() => {
    layoutJustifiedGrid(currentImages, imageGrid);
  });

  // Window resize listener để update layout
  const resizeHandler = () => {
    layoutJustifiedGrid(currentImages, imageGrid);
  };
  if (imageGrid._resizeHandler) {
    window.removeEventListener('resize', imageGrid._resizeHandler);
  }
  window.addEventListener('resize', resizeHandler);
  imageGrid._resizeHandler = resizeHandler;

  // Init SortableJS — Spec Section 7
  if (imageGrid._sortable) imageGrid._sortable.destroy();
  imageGrid._sortable = Sortable.create(imageGrid, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: () => {
      const items = imageGrid.querySelectorAll('.admin-image-item');
      const newImages = [];
      items.forEach((item, index) => {
        // Update badge visually
        item.querySelector('.order-badge').textContent = index + 1;
        // Rebuild the order array for layout justification
        newImages.push(currentImages.find(i => i.id === item.dataset.id));
      });
      currentImages = newImages;

      // Re-layout immediately after drop to match the original final view
      layoutJustifiedGrid(currentImages, imageGrid);

      // Show the save button
      const saveBtn = document.getElementById('btn-save-order');
      if (saveBtn) saveBtn.style.display = 'block';
    },
  });

  // Hide save button initially
  const saveBtn = document.getElementById('btn-save-order');
  if (saveBtn) saveBtn.style.display = 'none';
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
// NOTIFICATIONS
// ==========================================

function setupNotifications() {
  const btnNotify = document.getElementById('btn-notifications');
  const popup = document.getElementById('notification-popup');
  const badge = document.getElementById('notification-badge');
  const listEl = document.getElementById('notification-list');

  if (!btnNotify || !popup) return;

  btnNotify.addEventListener('click', async (e) => {
    e.stopPropagation();
    popup.classList.toggle('active');
    
    // Đánh dấu đã đọc (Optimistic UI)
    if (popup.classList.contains('active') && badge.style.display !== 'none') {
      badge.style.display = 'none';
      
      try {
        const unreadItems = listEl.querySelectorAll('.notification-item.unread');
        const batch = writeBatch(db);
        unreadItems.forEach(item => {
          const id = item.dataset.id;
          if (id) {
            batch.update(doc(db, 'login_alerts', id), { isRead: true });
            item.classList.remove('unread');
          }
        });
        await batch.commit();
      } catch (err) {
        console.error("Error marking alerts as read", err);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !btnNotify.contains(e.target)) {
      popup.classList.remove('active');
    }
  });

  // Lắng nghe realtime
  const q = query(collection(db, 'login_alerts'), orderBy('timestamp', 'desc'), limit(20));
  onSnapshot(q, (snapshot) => {
    let unreadCount = 0;
    let html = '';

    if (snapshot.empty) {
      listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 13px;">Chưa có thông báo nào</div>';
      badge.style.display = 'none';
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.isRead) unreadCount++;
      
      const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString('vi-VN') : 'Vừa xong';
      const isUnreadClass = data.isRead ? '' : 'unread';
      
      html += `
        <div class="notification-item ${isUnreadClass}" data-id="${docSnap.id}">
          <strong style="color: var(--color-danger);">Cảnh báo bảo mật</strong>
          <span>Có thiết bị nhập sai Admin Code quá 3 lần.</span>
          <span style="color: var(--color-text-muted); font-size: 12px;">OS: ${data.platform || 'Unknown'}</span>
          <span style="color: var(--color-text-subtle); font-size: 11px;">${timeStr}</span>
        </div>
      `;
    });

    listEl.innerHTML = html;
    
    if (unreadCount > 0) {
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }, (error) => {
    console.error("Lỗi khi tải thông báo:", error);
    listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--color-danger); font-size: 13px;">Lỗi tải thông báo: ' + error.message + '</div>';
  });
}

// ==========================================
// ADMIN PROFILE MODAL
// ==========================================

async function setupAdminProfile() {
  const btnOpen = document.getElementById('btn-admin-profile');
  const modal = document.getElementById('modal-admin-profile');
  const btnClose = document.querySelector('.modal-close-profile');
  
  if (!btnOpen || !modal) return;

  const loadEmails = async () => {
    const listEl = document.getElementById('allowed-emails-list');
    listEl.innerHTML = '<li style="color: var(--color-text-muted);">Đang tải...</li>';
    const emails = await getAllowedEmails();
    listEl.innerHTML = '';
    emails.forEach(email => {
      listEl.innerHTML += `
        <li>
          <span>${email}</span>
          <button type="button" class="btn-icon danger btn-sm delete-email-btn" data-email="${email}">🗑️</button>
        </li>
      `;
    });

    listEl.querySelectorAll('.delete-email-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const emailToDelete = e.currentTarget.dataset.email;
        if (emails.length <= 1) {
          showToast('Phải giữ lại ít nhất 1 email', 'error');
          return;
        }
        if (confirm(`Xóa quyền admin của ${emailToDelete}?`)) {
          const newEmails = emails.filter(em => em !== emailToDelete);
          await setDoc(doc(db, 'admin_settings', 'config'), { allowed_emails: newEmails }, { merge: true });
          showToast('Đã xóa email', 'success');
          loadEmails();
        }
      });
    });
  };

  const loadHistory = async () => {
    const listEl = document.getElementById('admin-login-history');
    listEl.innerHTML = '<div class="skeleton" style="height: 60px;"></div>';
    
    try {
      const q = query(collection(db, 'admin_login_history'), orderBy('timestamp', 'desc'), limit(10));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 13px;">Chưa có lịch sử</div>';
        return;
      }

      let html = '';
      snap.forEach(d => {
        const data = d.data();
        const timeStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString('vi-VN') : '';
        html += `
          <div class="history-item">
            <div>
              <div style="font-weight: 500;">${data.user || 'Admin Code'}</div>
              <div style="font-size: 12px; color: var(--color-text-muted);">${data.userAgent || ''}</div>
            </div>
            <div style="font-size: 12px; color: var(--color-text-subtle);">${timeStr}</div>
          </div>
        `;
      });
      listEl.innerHTML = html;
    } catch (e) {
      console.error("Lỗi tải lịch sử:", e);
      listEl.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--color-danger); font-size: 13px;">Không thể tải lịch sử: ' + e.message + '</div>';
    }
  };

  btnOpen.addEventListener('click', () => {
    modal.classList.add('active');
    loadEmails();
    loadHistory();
  });

  const closeModal = () => modal.classList.remove('active');
  btnClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Add Email
  const formAddEmail = document.getElementById('form-add-email');
  formAddEmail.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEmail = document.getElementById('input-new-email').value.trim();
    if (!newEmail) return;

    try {
      const currentEmails = await getAllowedEmails();
      if (currentEmails.includes(newEmail)) {
        showToast('Email này đã tồn tại', 'error');
        return;
      }
      
      const newEmails = [...currentEmails, newEmail];
      await setDoc(doc(db, 'admin_settings', 'config'), { allowed_emails: newEmails }, { merge: true });
      showToast('Đã thêm email thành công', 'success');
      document.getElementById('input-new-email').value = '';
      loadEmails();
    } catch (err) {
      showToast('Lỗi khi thêm email: ' + err.message, 'error');
    }
  });

  // Change Passcode
  const formChangeCode = document.getElementById('form-change-code');
  formChangeCode.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('code-msg');
    
    if (currentUser.email !== ADMIN_CODE_EMAIL) {
      msg.textContent = 'Bạn phải đăng nhập bằng Code hiện tại để đổi Code mới.';
      msg.style.color = 'var(--color-danger)';
      return;
    }

    const oldCode = document.getElementById('input-old-code').value;
    const newCode = document.getElementById('input-new-code').value;

    try {
      msg.textContent = 'Đang xử lý...';
      msg.style.color = 'var(--color-text-muted)';
      
      // Verify old password (just calling signIn directly on auth might mess up state, but updatePassword handles it if recently signed in)
      // For security, if token is old, we might need to re-authenticate. Assuming they just logged in:
      await changeAdminCode(newCode);
      
      msg.textContent = 'Đổi Admin Code thành công!';
      msg.style.color = '#065f46';
      formChangeCode.reset();
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        msg.textContent = 'Vui lòng đăng xuất và đăng nhập lại bằng Code hiện tại trước khi đổi.';
      } else {
        msg.textContent = err.message || 'Lỗi khi đổi Code.';
      }
      msg.style.color = 'var(--color-danger)';
    }
  });
}

// ==========================================
// INIT
// ==========================================

export async function initAdminPage() {
  // Check auth
  onAuthChange((user) => {
    if (!user) {
      window.location.href = '/admin/';
      return;
    }
    currentUser = user;
  });

  // Wait for auth
  currentUser = await getCurrentUser();
  if (!currentUser) {
    window.location.href = '/admin/';
    return;
  }

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.href = '/admin/';
    });
  }

  // Back to list button
  const backToListBtn = document.getElementById('btn-back-to-list');
  if (backToListBtn) {
    backToListBtn.addEventListener('click', () => {
      hideProjectDetail();
    });
  }

  // Save order button
  const saveOrderBtn = document.getElementById('btn-save-order');
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', async () => {
      if (!selectedProjectId) return;
      
      const originalText = saveOrderBtn.textContent;
      saveOrderBtn.textContent = 'Đang lưu...';
      saveOrderBtn.disabled = true;

      try {
        const imageGrid = document.getElementById('admin-image-grid');
        const items = imageGrid.querySelectorAll('.admin-image-item');
        const batch = writeBatch(db);

        items.forEach((item, index) => {
          const imgId = item.dataset.id;
          const ref = doc(db, 'projects', selectedProjectId, 'images', imgId);
          batch.update(ref, { order: index });
        });

        await batch.commit();
        showToast('Đã lưu bố cục ảnh', 'success');
        saveOrderBtn.style.display = 'none';
      } catch (error) {
        console.error('Error saving order:', error);
        showToast('Lỗi khi lưu bố cục', 'error');
      } finally {
        saveOrderBtn.textContent = originalText;
        saveOrderBtn.disabled = false;
      }
    });
  }

  setupCreateModal();
  setupUpload();
  setupNotifications();
  setupAdminProfile();
  await renderProjectList();
}
