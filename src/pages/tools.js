/**
 * Tools Page — Image → WebP Converter
 * Xử lý 100% client-side bằng Canvas API
 * Không upload bất kỳ dữ liệu nào lên server
 */

/**
 * Format bytes thành KB/MB
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Convert 1 file ảnh sang WebP bằng Canvas
 * @param {File} file - File ảnh gốc
 * @param {number} quality - Chất lượng 0.0 → 1.0
 * @param {number} maxWidth - Chiều rộng tối đa (0 = giữ nguyên)
 * @returns {Promise<{blob: Blob, width: number, height: number}>}
 */
function convertToWebP(file, quality, maxWidth) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      // Resize nếu cần
      if (maxWidth > 0 && w > maxWidth) {
        const ratio = maxWidth / w;
        w = maxWidth;
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width: w, height: h });
          } else {
            reject(new Error('Không thể tạo WebP'));
          }
        },
        'image/webp',
        quality
      );

      // Giải phóng bộ nhớ
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Không thể đọc ảnh'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Tải 1 blob về máy
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * State quản lý kết quả
 */
let results = [];

/**
 * Render 1 file item vào danh sách kết quả
 */
function renderFileItem(item, index) {
  const savedPercent = Math.round((1 - item.newSize / item.originalSize) * 100);
  const thumbUrl = URL.createObjectURL(item.blob);

  const el = document.createElement('div');
  el.className = 'tool-file-item';
  el.innerHTML = `
    <img class="file-thumb" src="${thumbUrl}" alt="${item.name}" loading="lazy">
    <div class="file-info">
      <div class="file-name" title="${item.name}">${item.name.replace(/\.[^.]+$/, '')}.webp</div>
      <div class="file-meta">
        <span>${item.dimensions}</span>
        <span>${formatSize(item.originalSize)} → <strong>${formatSize(item.newSize)}</strong></span>
        <span class="file-saved">${savedPercent > 0 ? `Giảm ${savedPercent}%` : 'Tăng kích thước'}</span>
      </div>
    </div>
    <div class="file-actions">
      <button class="btn-secondary btn-sm btn-download-single" data-index="${index}" title="Tải về">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      </button>
    </div>
  `;

  // Download single
  el.querySelector('.btn-download-single').addEventListener('click', () => {
    const webpName = item.name.replace(/\.[^.]+$/, '') + '.webp';
    downloadBlob(item.blob, webpName);
  });

  return el;
}

/**
 * Cập nhật thống kê tổng hợp
 */
function updateSummary() {
  const summaryEl = document.getElementById('tool-summary');
  if (results.length === 0) {
    summaryEl.style.display = 'none';
    return;
  }

  summaryEl.style.display = 'block';
  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0);
  const totalNew = results.reduce((s, r) => s + r.newSize, 0);
  const savedPercent = Math.round((1 - totalNew / totalOriginal) * 100);

  document.getElementById('summary-count').textContent = results.length;
  document.getElementById('summary-original').textContent = formatSize(totalOriginal);
  document.getElementById('summary-compressed').textContent = formatSize(totalNew);
  document.getElementById('summary-saved').textContent = `Tiết kiệm ${savedPercent}%`;
}

/**
 * Xử lý hàng loạt file
 */
async function processFiles(files) {
  const quality = parseInt(document.getElementById('quality-slider').value) / 100;
  const maxWidth = parseInt(document.getElementById('max-width-input').value) || 0;

  const resultsSection = document.getElementById('tool-results');
  const fileList = document.getElementById('tool-file-list');
  const btnDownloadAll = document.getElementById('btn-download-all');

  resultsSection.style.display = 'block';

  for (const file of files) {
    // Bỏ qua file không phải ảnh
    if (!file.type.startsWith('image/')) continue;

    // Tạo placeholder "Đang xử lý..."
    const placeholder = document.createElement('div');
    placeholder.className = 'tool-file-item';
    placeholder.innerHTML = `
      <div style="width: 48px; height: 48px; border-radius: 6px; background: #f0f0f0; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-muted); animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-meta"><span style="color: var(--color-text-muted);">Đang chuyển đổi...</span></div>
        <div class="progress-bar"><div class="fill" style="width: 40%;"></div></div>
      </div>
    `;
    fileList.appendChild(placeholder);

    try {
      const result = await convertToWebP(file, quality, maxWidth);

      const item = {
        name: file.name,
        originalSize: file.size,
        newSize: result.blob.size,
        blob: result.blob,
        dimensions: `${result.width}×${result.height}`,
      };

      results.push(item);

      // Thay placeholder bằng kết quả
      const rendered = renderFileItem(item, results.length - 1);
      placeholder.replaceWith(rendered);
    } catch (err) {
      console.error('Convert error:', file.name, err);
      placeholder.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 6px; background: #fef2f2; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div class="file-info">
          <div class="file-name" style="color: var(--color-danger);">${file.name}</div>
          <div class="file-meta"><span>Lỗi: ${err.message}</span></div>
        </div>
      `;
    }
  }

  updateSummary();

  // Hiện nút "Tải tất cả" nếu có >= 2 kết quả
  if (results.length >= 2) {
    btnDownloadAll.style.display = 'flex';
  }
}

/**
 * Init trang Tools
 */
export function initToolsPage() {
  const dropZone = document.getElementById('tool-drop-zone');
  const fileInput = document.getElementById('tool-file-input');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityValue = document.getElementById('quality-value');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnDownloadAll = document.getElementById('btn-download-all');

  if (!dropZone) return;

  // Drop zone events
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) processFiles(files);
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) processFiles(files);
    fileInput.value = '';
  });

  // Quality slider
  qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
  });

  // Clear all
  btnClearAll.addEventListener('click', () => {
    results = [];
    document.getElementById('tool-file-list').innerHTML = '';
    document.getElementById('tool-results').style.display = 'none';
    document.getElementById('tool-summary').style.display = 'none';
    btnDownloadAll.style.display = 'none';
  });

  // Download all as zip (simple: download individually)
  btnDownloadAll.addEventListener('click', async () => {
    // Thử dùng JSZip nếu có, fallback download từng file
    if (typeof JSZip === 'undefined') {
      // Load JSZip dynamically
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      } catch {
        // Fallback: tải từng file
        results.forEach(item => {
          const webpName = item.name.replace(/\.[^.]+$/, '') + '.webp';
          downloadBlob(item.blob, webpName);
        });
        return;
      }
    }

    // Tạo ZIP
    btnDownloadAll.disabled = true;
    btnDownloadAll.textContent = 'Đang nén...';

    const zip = new JSZip();
    results.forEach(item => {
      const webpName = item.name.replace(/\.[^.]+$/, '') + '.webp';
      zip.file(webpName, item.blob);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'images-webp.zip');

    btnDownloadAll.disabled = false;
    btnDownloadAll.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      Tải tất cả (.zip)
    `;
  });

  // Thêm animation spin cho loading icon
  if (!document.getElementById('tool-spin-style')) {
    const style = document.createElement('style');
    style.id = 'tool-spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }
}
