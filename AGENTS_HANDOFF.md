# Project Handoff

Last commit: pending

## 1. Tóm tắt dự án & Tech Stack
- **Dự án**: Pinterest-Portfolio (Trang portfolio dạng lưới hình ảnh giống Pinterest).
- **Tech Stack**: HTML, CSS, JavaScript thuần (Vanilla JS), Firebase (Firestore, Auth), Cloudinary (lưu trữ ảnh & tối ưu ảnh on-the-fly), Vercel (Serverless Functions).

## 2. Trạng thái hiện tại
- Đã có tính năng upload ảnh lên Cloudinary qua Dashboard.
- Đã có API và giao diện hiển thị thống kê dung lượng Cloudinary trực tiếp trên Dashboard.
- Đã có tính năng chọn Thumbnail tùy chỉnh (Auto, Group 3 ảnh, Ảnh đơn) cho các Section hiển thị dạng dự án hình ảnh.

## 3. Thay đổi gần nhất
- **10/10/2026**: Tích hợp Dynamic Open Graph Preview (`api/og-preview.js` + `vercel.json`): tự động render thẻ OG image/title từ Firestore cho Facebook, Zalo, Twitter khi share link `project.html`.
- **10/10/2026**: Tạo dynamic Sitemap (`api/sitemap.js`) tự động lấy toàn bộ projects từ Firestore, kèm `public/robots.txt` và `public/sitemap.xml`.
- **10/10/2026**: Tinh chỉnh Global Footer: link "Công cụ" text thuần (14px), tách khỏi icon MXH, ẩn trên mobile.
- **10/10/2026**: Tạo trang `/tools/` với "Image → WebP Converter" client-side (Canvas API) và Global Footer (`src/components/footer.js`).
- **06/10/2026**: Thêm tính năng "OG Image Cropper" trong Admin Dashboard.
- **06/10/2026**: Nâng cấp SEO toàn diện (seo.js, Open Graph, Twitter Card, JSON-LD).
- **06/10/2026**: Tạo `tools/batch-convert.js` — CLI tool batch convert ảnh sang WebP.
- **04/10/2026**: Thêm tính năng cấu hình Thumbnail cho dự án ảnh (Auto, Group 3, Single).
- **04/10/2026**: Tích hợp Lightbox với độ phân giải màn hình thực tế, fix lỗi ảnh ngang siêu rộng.
- **01/10/2026**: Thiết kế lại Widget hiển thị dung lượng Cloudinary trên Dashboard (Credits, Storage, Bandwidth).

## 4. Hướng dẫn cho AI/máy tiếp theo
- **Dynamic SEO & Social Preview**: `vercel.json` cấu hình rewrite bot MXH sang `api/og-preview.js` và rewrite `/sitemap.xml` sang `api/sitemap.js`. Hai hàm này dùng Firestore REST API để đọc trực tiếp data không cần SDK nặng.
- **Trang Tools** (`/tools/`): entry tại `tools/index.html`, logic `src/pages/tools.js`, CSS `src/styles/tools.css`.
- **Global Footer**: `src/components/footer.js` — gọi `renderGlobalFooter()` trong mọi trang.
- **SEO client**: `src/config/seo.js` cho trải nghiệm xem trình duyệt bình thường.
