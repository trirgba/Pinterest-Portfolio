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
- **10/10/2026**: Tinh chỉnh Global Footer: link "Công cụ" dùng text thuần (14px), tách riêng khỏi cụm icon MXH, ẩn trên mobile qua responsive CSS mà không ảnh hưởng SEO.
- **10/10/2026**: Tạo trang `/tools/` với công cụ "Image → WebP Converter" client-side (Canvas API) và Global Footer component (`src/components/footer.js`).
- **06/10/2026**: Thêm tính năng "OG Image Cropper" trong Admin Dashboard.
- **06/10/2026**: Nâng cấp SEO toàn diện (seo.js, Open Graph, Twitter Card, JSON-LD).
- **06/10/2026**: Tạo `tools/batch-convert.js` — CLI tool batch convert ảnh sang WebP.
- **04/10/2026**: Thêm tính năng cấu hình Thumbnail cho dự án ảnh trên trang chủ. Hỗ trợ 3 chế độ: "Auto", "Group 3", và "Single".
- **04/10/2026**: Tích hợp Lightbox với độ phân giải màn hình thực tế, fix lỗi ảnh ngang siêu rộng.
- **01/10/2026**: Thiết kế lại Widget hiển thị dung lượng Cloudinary trên Dashboard (Credits, Storage, Bandwidth).
- **01/10/2026**: Sửa lỗi parse Cloudinary Usage API, fix cảnh báo DOM và autocomplete mật khẩu.
- **01/10/2026**: Thêm Serverless Function `api/cloudinary-usage.js` lấy dữ liệu dung lượng Cloudinary.

## 4. Hướng dẫn cho AI/máy tiếp theo
- **Trang Tools** (`/tools/`): entry tại `tools/index.html`, logic `src/pages/tools.js`, CSS `src/styles/tools.css`. Thêm tool mới bằng cách thêm tab và section mới.
- **Global Footer**: `src/components/footer.js` — gọi `renderGlobalFooter()` trong mọi trang. Chỉ sửa 1 file để cập nhật footer toàn bộ.
- **SEO**: `src/config/seo.js` quản lý SEO tập trung. Trang tools có JSON-LD `WebApplication` riêng.
- Nếu cần chạy local với API Vercel, đảm bảo biến môi trường `CLOUDINARY_API_SECRET` trên Vercel.
- Tiếp theo: thêm công cụ mới (Image Resizer, Color Palette Extractor...), sitemap.xml động.
