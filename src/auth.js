/**
 * Authentication — Google OAuth + Email Whitelist
 * Spec Section 7
 */
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';

const ALLOWED_EMAILS = [
  'mintri.arena@gmail.com',
  'trixinchao@gmail.com',
];

/**
 * Đăng nhập bằng Google OAuth
 * Nếu email không nằm trong whitelist → signOut ngay + throw error
 */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!ALLOWED_EMAILS.includes(user.email)) {
    await signOut(auth);
    throw new Error('Email này không có quyền truy cập admin.');
  }

  return user;
}

/**
 * Đăng xuất
 */
export async function logout() {
  await signOut(auth);
}

/**
 * Kiểm tra trạng thái auth hiện tại
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user && ALLOWED_EMAILS.includes(user.email)) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Lắng nghe thay đổi auth state
 * @param {function} callback
 * @returns {function} unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.includes(user.email)) {
      callback(user);
    } else {
      callback(null);
    }
  });
}
