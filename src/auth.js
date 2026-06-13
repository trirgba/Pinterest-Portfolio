/**
 * Authentication — Google OAuth + Admin Code + Firestore Whitelist
 */
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const FALLBACK_EMAILS = [
  'mintri.arena@gmail.com',
  'trixinchao@gmail.com',
];

export const ADMIN_CODE_EMAIL = 'admin_account@portfolio.local';

/**
 * Lấy danh sách email được phép từ Firestore
 */
export async function getAllowedEmails() {
  try {
    const docSnap = await getDoc(doc(db, 'admin_settings', 'config'));
    if (docSnap.exists() && docSnap.data().allowed_emails) {
      return docSnap.data().allowed_emails;
    }
  } catch (e) {
    console.warn("Could not fetch allowed emails, using fallback", e);
  }
  return FALLBACK_EMAILS;
}

/**
 * Kiểm tra xem user có phải là admin không
 */
async function checkIsAdmin(user) {
  if (!user) return false;
  if (user.email === ADMIN_CODE_EMAIL) return true;
  const allowed = await getAllowedEmails();
  return allowed.includes(user.email);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const isAdmin = await checkIsAdmin(user);
  if (!isAdmin) {
    await signOut(auth);
    throw new Error('Email này không có quyền truy cập admin.');
  }

  return user;
}

export async function loginWithCode(code) {
  try {
    const result = await signInWithEmailAndPassword(auth, ADMIN_CODE_EMAIL, code);
    return result.user;
  } catch (error) {
    // Nếu lỗi do user không tồn tại hoặc sai thông tin (phiên bản Firebase mới hay gộp chung lỗi credential)
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
      if (code === 'Rau@gency2023') {
        try {
          const result = await createUserWithEmailAndPassword(auth, ADMIN_CODE_EMAIL, code);
          return result.user;
        } catch (createError) {
          console.error("Create account error:", createError);
          throw new Error('Vui lòng bật Email/Password Provider trong Firebase Console.');
        }
      }
    }
    throw new Error('Sai Admin Code.');
  }
}

export async function changeAdminCode(newCode) {
  const user = auth.currentUser;
  if (user && user.email === ADMIN_CODE_EMAIL) {
    await updatePassword(user, newCode);
  } else {
    throw new Error('Chỉ có thể đổi code khi đăng nhập bằng Admin Code.');
  }
}

export async function logout() {
  await signOut(auth);
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        const isAdmin = await checkIsAdmin(user);
        if (isAdmin) {
          resolve(user);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkIsAdmin(user);
      if (isAdmin) {
        callback(user);
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
