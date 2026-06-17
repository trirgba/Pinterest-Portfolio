/**
 * Sections Config
 * Định nghĩa các section portfolio + helpers đọc/ghi tên section từ Firestore.
 * Tên section lưu ở Firestore (admin_settings/config.section_names),
 * fallback về DEFAULT_SECTIONS nếu chưa có.
 */
import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Default sections — dùng khi Firestore chưa có dữ liệu
 */
export const DEFAULT_SECTIONS = [
  { id: '1', name: 'Social Post' },
  { id: '2', name: 'Photo' },
  { id: '3', name: '2D Campaign' },
  { id: '4', name: 'Short Video' },
  { id: '5', name: 'Video' },
  { id: '6', name: 'Poster' },
  { id: '7', name: '3D Design' },
];

/**
 * Fetch tên section từ Firestore, merge với default
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchSectionNames() {
  try {
    const snap = await getDoc(doc(db, 'admin_settings', 'config'));
    const firestoreNames = snap.exists() ? snap.data().section_names || {} : {};

    return DEFAULT_SECTIONS.map((section) => ({
      id: section.id,
      name: firestoreNames[section.id] || section.name,
    }));
  } catch (error) {
    console.warn('Không thể tải tên section từ Firestore, dùng mặc định:', error);
    return [...DEFAULT_SECTIONS];
  }
}

/**
 * Lưu tên section vào Firestore
 * @param {string} sectionId - ID của section ("1", "2", ...)
 * @param {string} newName - Tên mới
 */
export async function saveSectionName(sectionId, newName) {
  const snap = await getDoc(doc(db, 'admin_settings', 'config'));
  const currentNames = snap.exists() ? snap.data().section_names || {} : {};
  currentNames[sectionId] = newName;

  await setDoc(
    doc(db, 'admin_settings', 'config'),
    { section_names: currentNames },
    { merge: true }
  );
}
