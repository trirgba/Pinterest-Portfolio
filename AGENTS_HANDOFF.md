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
- **10/10/2026**: Tạo trang `/tools/` với công cụ "Image → WebP Converter" chạy 100% client-side (Canvas API). Kéo thả ảnh, tuỳ chỉnh chất lượng + kích thước, tải về từng file hoặc ZIP. SEO đầy đủ (JSON-LD `WebApplication`, OG, Twitter Card) để đẩy lên Google. Cấu trúc trang hỗ trợ mở rộng thêm tool mới qua tabs.
- **10/10/2026**: Tạo Global Footer component (`src/components/footer.js`). Áp dụng đồng nhất trên tất cả các trang (index, project, dashboard, tools). Có link đến trang Công cụ.
- **06/10/2026**: Thêm tính năng "OG Image Cropper" trong Admin Dashboard.
- **06/10/2026**: Nâng cấp SEO toàn diện (seo.js, Open Graph, Twitter Card, JSON-LD).
- **06/10/2026**: Tạo `tools/batch-convert.js` — CLI tool batch convert ảnh sang WebP.
- **04/10/2026**: Thêm tính năng cấu hình Thumbnail cho dự án ảnh trên trang chủ. Hỗ trợ 3 chế độ: "Auto", "Group 3", và "Single".
- **04/10/2026**: Tích hợp Lightbox với độ phân giải màn hình thực tế, fix lỗi ảnh ngang siêu rộng.
- **01/10/2026**: Thiết kế lại Widget hiển thị dung lượng Cloudinary trên Dashboard, tách bạch rõ ràng phần "Tổng Credits tiêu thụ" (Progress bar), "Dung lượng Storage đang lưu" (GB) và "Băng thông Bandwidth đã dùng trong 30 ngày qua" (GB) để User dễ theo dõi.
- **01/10/2026**: Sửa lỗi "Cannot read properties of undefined (reading 'toFixed')" khi parse dữ liệu từ Cloudinary Usage API bằng cách đọc `data.credits` thay vì `data.storage` (vì bản free tính giới hạn theo credit). Fix cảnh báo DOM bằng cách thêm hidden username input.
- **01/10/2026**: Cài đặt thư viện `cloudinary` vào package.json để fix lỗi 500 khi Vercel chạy API `cloudinary-usage`. Thêm thuộc tính `autocomplete` vào các ô nhập mật khẩu.
- **01/10/2026**: Thêm Vercel Serverless Function `api/cloudinary-usage.js` để lấy dữ liệu dung lượng Cloudinary bằng Admin API.
- **01/10/2026**: Thêm widget tiến độ dung lượng (Progress Bar) vào `admin/dashboard.html` và fetch/render data trong `src/pages/admin.js`.

## 4. Hướng dẫn cho AI/máy tiếp theo
- **Trang Tools** (`/tools/`): entry tại `tools/index.html`, logic `src/pages/tools.js`, CSS `src/styles/tools.css`. Thêm tool mới bằng cách thêm tab và section mới.
- **Global Footer**: `src/components/footer.js` — gọi `renderGlobalFooter()` trong mọi trang. Chỉ sửa 1 file để cập nhật footer toàn bộ.
- **SEO**: `src/config/seo.js` quản lý SEO tập trung. Trang tools có JSON-LD `WebApplication` riêng.
- Nếu cần chạy local với API Vercel, đảm bảo biến môi trường `CLOUDINARY_API_SECRET` trên Vercel.
- Tiếp theo: thêm công cụ mới (Image Resizer, Color Palette Extractor...), sitemap.xml động.
