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
- **06/10/2026**: Thêm tính năng "OG Image Cropper" trong Admin Dashboard. Cho phép tuỳ chỉnh ảnh share Facebook bằng cách chọn từ thư viện dự án hoặc tải lên file mới. Hỗ trợ giao diện kéo/thả/zoom để cắt ảnh đúng tỉ lệ 1200x630. Hệ thống tự động dùng thuật toán `<canvas>` render ảnh client-side rồi upload lên Cloudinary.
- **06/10/2026**: Nâng cấp SEO toàn diện. Sửa `seo.js` — thêm `injectProjectSEO()`, `upsertMeta()` tránh duplicate, Open Graph, Twitter Card, JSON-LD `ImageGallery`, canonical URL. Cập nhật `SITE_CONFIG.role = 'Multimedia Designer'`. Gọi `injectSEO()` trong `home.js`, `injectProjectSEO()` trong `project.js` (dùng ảnh đầu tiên làm OG image mặc định nếu admin không set). Cập nhật `index.html` + `project.html` với placeholder meta tags. Thêm `fl_keep_iptc` vào `cloudinary.js`.
- **06/10/2026**: Tạo `tools/batch-convert.js` — CLI tool dùng `sharp` để batch convert hàng loạt ảnh sang WebP.
- **04/10/2026**: Thêm tính năng cấu hình Thumbnail cho dự án ảnh trên trang chủ. Hỗ trợ 3 chế độ: "Auto", "Group 3", và "Single".
- **04/10/2026**: Tích hợp Lightbox với độ phân giải màn hình thực tế, fix lỗi ảnh ngang siêu rộng.
- **01/10/2026**: Thiết kế lại Widget hiển thị dung lượng Cloudinary trên Dashboard, tách bạch rõ ràng phần "Tổng Credits tiêu thụ" (Progress bar), "Dung lượng Storage đang lưu" (GB) và "Băng thông Bandwidth đã dùng trong 30 ngày qua" (GB) để User dễ theo dõi.
- **01/10/2026**: Sửa lỗi "Cannot read properties of undefined (reading 'toFixed')" khi parse dữ liệu từ Cloudinary Usage API bằng cách đọc `data.credits` thay vì `data.storage` (vì bản free tính giới hạn theo credit). Fix cảnh báo DOM bằng cách thêm hidden username input.
- **01/10/2026**: Cài đặt thư viện `cloudinary` vào package.json để fix lỗi 500 khi Vercel chạy API `cloudinary-usage`. Thêm thuộc tính `autocomplete` vào các ô nhập mật khẩu.
- **01/10/2026**: Thêm Vercel Serverless Function `api/cloudinary-usage.js` để lấy dữ liệu dung lượng Cloudinary bằng Admin API.
- **01/10/2026**: Thêm widget tiến độ dung lượng (Progress Bar) vào `admin/dashboard.html` và fetch/render data trong `src/pages/admin.js`.

## 4. Hướng dẫn cho AI/máy tiếp theo
- **Tool convert**: `npm run convert ~/Desktop/<folder>` — tạo WebP + EXIF metadata. File config tác giả ở đầu `tools/batch-convert.js`.
- **SEO**: `src/config/seo.js` là nơi duy nhất quản lý thông tin. Sửa `SITE_CONFIG` nếu cần đổi URL/tên. `injectSEO()` cho trang chủ, `injectProjectSEO(project, ogImageUrl)` cho trang project.
- Nếu cần chạy local với API Vercel, hãy đảm bảo biến môi trưẝng `CLOUDINARY_API_SECRET` được thiết lập trên Vercel.
- Tiếp theo có thể làm: sitemap.xml động, OG image design riêng (1200×630) cho branding.
