/**
 * Cloudinary Upload Helpers
 * Spec Section 3 — Unsigned upload with preset ml_default
 */

import { SITE_CONFIG } from './config/seo.js';

const CLOUD_NAME = 'dft21ara1';
const UPLOAD_PRESET = 'ml_default';

/**
 * Upload file lên Cloudinary dùng unsigned upload
 * Đính kèm thông tin bản quyền qua Cloudinary Context
 * @param {File} file - File ảnh cần upload
 * @returns {Promise<{cloudinaryId: string, url: string, width: number, height: number}>}
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Đính kèm metadata thẳng vào file trên Cloudinary (Cloudinary Context)
  const contextStr = `author=${SITE_CONFIG.authorName}|designer=${SITE_CONFIG.designerName}|email=${SITE_CONFIG.email}|website=${SITE_CONFIG.website}`;
  formData.append('context', contextStr);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    cloudinaryId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height,
  };
}

/**
 * Xoá ảnh qua Vercel Serverless Function
 * API Secret KHÔNG ở client — chỉ gọi endpoint server-side
 * @param {string} publicId - Cloudinary public_id
 * @param {string} idToken - Firebase ID token để verify auth
 */
export async function deleteFromCloudinary(publicId, idToken) {
  const res = await fetch('/api/delete-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ publicId }),
  });

  if (!res.ok) {
    throw new Error(`Delete failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Tạo URL tối ưu từ Cloudinary với transformations (Mặc định: WebP)
 * @param {string} publicId
 * @param {Object} options
 * @returns {string}
 */
export function getOptimizedUrl(publicId, options = {}) {
  // Ép mặc định sang webp và chất lượng tự động tối ưu
  const { width, quality = 'auto', format = 'webp' } = options;
  const transforms = [`f_${format}`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(',')}/${publicId}`;
}
