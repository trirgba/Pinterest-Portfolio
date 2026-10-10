/**
 * Global Footer Component
 * Render footer đồng nhất trên tất cả các trang
 */
export function renderGlobalFooter() {
  const footerEl = document.getElementById('global-footer');
  if (!footerEl) return;

  footerEl.style.cssText = 'padding: 10px; background: #f5f5f5; border-top: 1px solid var(--color-border); margin-top: auto;';
  
  footerEl.innerHTML = `
    <div class="container" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <p style="color: var(--color-text-muted); font-size: 14px; margin: 0;">
        © ${new Date().getFullYear()} trixinchao . All rights reserved.
      </p>
      <div style="display: flex; align-items: center; gap: 12px; font-size: 14px;">
        <a href="/tools/" style="color: var(--color-text-muted); transition: color 0.2s; font-size: 13px; text-decoration: none;" title="Công cụ chuyển đổi ảnh WebP miễn phí">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -3px; margin-right: 2px;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          Công cụ
        </a>
        <a href="https://www.linkedin.com/in/trixinchao/" target="_blank" rel="noopener noreferrer"
          aria-label="Trí Nguyễn LinkedIn" title="Trí Nguyễn LinkedIn"
          style="color: var(--color-text-muted); transition: color 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" />
            <path d="M8 11l0 5" />
            <path d="M8 8l0 .01" />
            <path d="M12 16l0 -5" />
            <path d="M16 16v-3a2 2 0 0 0 -4 0" />
          </svg>
        </a>
        <a href="mailto:trixinchao@gmail.com" aria-label="Email Trí Nguyễn" title="Email Trí Nguyễn"
          style="color: var(--color-text-muted); transition: color 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" />
            <path d="M3 7l9 6l9 -6" />
          </svg>
        </a>
      </div>
    </div>
  `;
}
