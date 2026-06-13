import { loginWithGoogle, loginWithCode, getCurrentUser } from '../auth.js';
import { db } from '../firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function initLoginPage() {
  const user = await getCurrentUser();
  if (user) {
    window.location.href = '/admin/dashboard.html';
    return;
  }

  const btnGoogle = document.getElementById('btn-google-login');
  const btnCode = document.getElementById('btn-code-login');
  const inputCode = document.getElementById('input-admin-code');
  const errorDiv = document.getElementById('login-error');

  // Logic kiểm tra khoá
  const getLockStatus = () => {
    const data = localStorage.getItem('admin_code_attempts');
    if (!data) return { count: 0, lockedUntil: 0 };
    return JSON.parse(data);
  };

  const updateLockStatus = (count, lockedUntil) => {
    localStorage.setItem('admin_code_attempts', JSON.stringify({ count, lockedUntil }));
  };

  const isLocked = () => {
    const status = getLockStatus();
    if (status.lockedUntil > Date.now()) return true;
    if (status.lockedUntil !== 0 && status.lockedUntil < Date.now()) {
      updateLockStatus(0, 0); // reset if time passed
      return false;
    }
    return false;
  };

  const recordFailedAttempt = async () => {
    let status = getLockStatus();
    // Nếu đã qua thời gian khoá trước đó, reset count
    if (status.lockedUntil > 0 && status.lockedUntil < Date.now()) {
      status.count = 0;
      status.lockedUntil = 0;
    }

    status.count += 1;
    
    if (status.count >= 3) {
      // Khoá 3 ngày
      status.lockedUntil = Date.now() + 3 * 24 * 60 * 60 * 1000;
      
      // Bắn log lên Firestore
      try {
        await addDoc(collection(db, 'login_alerts'), {
          userAgent: navigator.userAgent,
          platform: navigator.platform || 'Unknown',
          timestamp: serverTimestamp(),
          isRead: false,
          type: 'failed_passcode'
        });
      } catch (e) {
        console.error("Failed to send alert", e);
      }
    }
    
    updateLockStatus(status.count, status.lockedUntil);
  };

  // Google Login
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      try {
        if (errorDiv) errorDiv.style.display = 'none';
        const user = await loginWithGoogle();
        
        try {
          await addDoc(collection(db, 'admin_login_history'), {
            user: user.email,
            userAgent: navigator.userAgent,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error("Failed to log history", e);
        }

        window.location.href = '/admin/dashboard.html';
      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = error.message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  // Code Login
  const handleCodeLogin = async () => {
    const code = inputCode.value.trim();
    if (!code) return;

    if (isLocked()) {
      // Yêu cầu: nhập sai không hiện gì hết, bị khoá thì cũng không cho vào
      inputCode.value = '';
      return;
    }

    try {
      if (errorDiv) errorDiv.style.display = 'none';
      await loginWithCode(code);
      // Đăng nhập thành công, reset attempt
      updateLockStatus(0, 0);
      
      try {
        await addDoc(collection(db, 'admin_login_history'), {
          user: 'Admin Code',
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to log history", e);
      }

      window.location.href = '/admin/dashboard.html';
    } catch (error) {
      // Nhập sai, ghi nhận lại
      inputCode.value = '';
      await recordFailedAttempt();
    }
  };

  if (btnCode && inputCode) {
    btnCode.addEventListener('click', handleCodeLogin);
    inputCode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleCodeLogin();
      }
    });
  }
}
